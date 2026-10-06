from __future__ import annotations

import os
import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.operator.model import Operator
from domain.operator.identity import resolve_operator
from domain.winch.model import Winch
from database.session import get_db


logger = logging.getLogger(__name__)

# Load the repository-level .env when the API is started from either the
# repository root or the backend directory. Railway uses injected variables.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class Principal:
    provider: str
    mode: str
    subject: str
    squadron_id: str
    operator_sn: str | None = None


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication provider configuration is missing: {name}",
        )
    return value


@lru_cache(maxsize=4)
def _jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(jwks_url)


def _decode_token(token: str, issuer: str, audience: str, jwks_url: str) -> dict[str, Any]:
    signing_key = _jwks_client(jwks_url).get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
        issuer=issuer.rstrip("/"),
        audience=audience,
        options={"require": ["exp", "iat", "sub"]},
    )


def _provider_configs() -> dict[str, dict[str, str]]:
    configs: dict[str, dict[str, str]] = {}
    for provider in ("clerk", "msal"):
        prefix = provider.upper()
        issuer = os.getenv(f"{prefix}_ISSUER")
        audience = os.getenv(f"{prefix}_AUDIENCE")
        jwks_url = os.getenv(f"{prefix}_JWKS_URL")
        if issuer and audience and jwks_url:
            configs[provider] = {
                "issuer": issuer,
                "audience": audience,
                "jwks_url": jwks_url,
            }
        elif any((issuer, audience, jwks_url)):
            missing = [
                name
                for name, value in (
                    (f"{prefix}_ISSUER", issuer),
                    (f"{prefix}_AUDIENCE", audience),
                    (f"{prefix}_JWKS_URL", jwks_url),
                )
                if not value
            ]
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Incomplete authentication provider configuration: {', '.join(missing)}",
            )
    if not configs:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No authentication provider is configured",
        )
    return configs


def _unverified_issuer(token: str) -> str:
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        return str(claims["iss"])
    except (jwt.DecodeError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Principal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    issuer = _unverified_issuer(token)
    configs = _provider_configs()
    provider = next(
        (
            name
            for name, config in configs.items()
            if config["issuer"].rstrip("/") == issuer.rstrip("/")
        ),
        None,
    )
    if provider is None:
        logger.warning(
            "Rejected bearer token: issuer did not match configured providers (token issuer=%s)",
            issuer,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown token issuer",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = _decode_token(token, **configs[provider])
    except jwt.ExpiredSignatureError as exc:
        logger.warning("Rejected expired %s bearer token", provider)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidAudienceError as exc:
        logger.warning("Rejected %s bearer token: audience mismatch", provider)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token audience is invalid",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidIssuerError as exc:
        logger.warning("Rejected %s bearer token: issuer mismatch", provider)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token issuer is invalid",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.PyJWKClientError as exc:
        logger.exception("Could not retrieve a signing key for %s", provider)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication signing keys are unavailable",
        ) from exc
    except (jwt.PyJWTError, ValueError, OSError) as exc:
        logger.warning("Rejected %s bearer token: %s", provider, type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    identity_claim = claims.get("oid") if provider == "msal" else claims.get("sub")
    if not identity_claim:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated token is missing its provider identity",
            headers={"WWW-Authenticate": "Bearer"},
        )
    subject = str(identity_claim)
    tenant_id = str(claims["tid"]) if provider == "msal" and claims.get("tid") else None
    if provider == "msal" and tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated token is missing its tenant identity",
            headers={"WWW-Authenticate": "Bearer"},
        )
    operator = await resolve_operator(db, provider, subject, tenant_id)
    return Principal(
        provider=provider,
        mode="individual_operator",
        subject=subject,
        squadron_id=operator.squadron_id,
        operator_sn=operator.service_no,
    )


async def authorize_winch(
    db: AsyncSession,
    principal: Principal,
    winch_id: int,
) -> Winch:
    winch = await db.get(Winch, winch_id)
    if winch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Winch not found")
    if principal.provider == "test":
        return winch
    if principal.mode == "individual_operator":
        operator = await db.scalar(select(Operator).where(Operator.service_no == principal.operator_sn))
        if operator is None or operator.squadron_id != winch.squadron_id or winch.squadron_id != principal.squadron_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator is not authorized for this winch")
    return winch


async def authorize_operator(
    db: AsyncSession,
    principal: Principal,
    operator_sn: str,
) -> Operator:
    operator = await db.scalar(select(Operator).where(Operator.service_no == operator_sn))
    if operator is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operator not found")
    if principal.provider == "test":
        return operator
    if principal.mode == "individual_operator" and operator.service_no != principal.operator_sn:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator does not match the authenticated user")
    if operator.squadron_id != principal.squadron_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator is outside your authorized squadron")
    return operator


def authorize_squadron(principal: Principal, squadron_id: str) -> None:
    if principal.provider == "test":
        return
    if squadron_id != principal.squadron_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Squadron is not authorized")


def authorize_admin(principal: Principal) -> None:
    configured_admins = {
        service_no.strip()
        for service_no in os.getenv("ADMIN_OPERATOR_SERVICE_NOS", "").split(",")
        if service_no.strip()
    }
    if principal.operator_sn not in configured_admins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required",
        )
