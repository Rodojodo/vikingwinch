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
from domain.winch.model import Winch


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


def _claim(claims: dict[str, Any], name: str) -> Any:
    value: Any = claims
    for part in name.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(part)
    return value


def _squadron_from_claims(claims: dict[str, Any]) -> str | None:
    configured = os.getenv("AUTH_SQUADRON_CLAIM", "squadron_id")
    value = _claim(claims, configured)
    if value is None:
        value = _claim(claims, "metadata.squadronId")
    if value is None:
        value = _claim(claims, "public_metadata.squadronId")
    if value is None:
        metadata = claims.get("public_metadata")
        if isinstance(metadata, dict):
            value = metadata.get("squadronId") or metadata.get("squadron_id")
    return str(value).strip() if value else None


def _operator_from_claims(claims: dict[str, Any]) -> str | None:
    configured = os.getenv("AUTH_OPERATOR_CLAIM", "service_no")
    value = _claim(claims, configured)
    if value is None:
        value = claims.get("employeeId")
    return str(value).strip() if value else None


async def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
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

    if provider == "msal":
        operator_sn = _operator_from_claims(claims)
        if not operator_sn:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token is not mapped to an operator")
        return Principal(
            provider=provider,
            mode="individual_operator",
            subject=str(claims["sub"]),
            squadron_id="",
            operator_sn=operator_sn,
        )

    squadron_id = _squadron_from_claims(claims)
    if not squadron_id:
        logger.warning(
            "Clerk token has no squadron claim; configured claim=%s, available claims=%s",
            os.getenv("AUTH_SQUADRON_CLAIM", "squadron_id"),
            sorted(claims.keys()),
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token is not mapped to a squadron; check the Clerk JWT template claim",
        )
    return Principal(
        provider=provider,
        mode="shared_squadron",
        subject=str(claims["sub"]),
        squadron_id=squadron_id,
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
    if principal.mode == "shared_squadron" and winch.squadron_id != principal.squadron_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Winch is outside your authorized squadron")
    if principal.mode == "individual_operator":
        operator = await db.scalar(select(Operator).where(Operator.service_no == principal.operator_sn))
        if operator is None or operator.squadron_id != winch.squadron_id:
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
    if principal.mode == "shared_squadron" and operator.squadron_id != principal.squadron_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator is outside your authorized squadron")
    return operator


def authorize_squadron(principal: Principal, squadron_id: str) -> None:
    if principal.provider == "test":
        return
    if principal.mode == "individual_operator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Individual operators cannot access squadron-wide resources",
        )
    if principal.mode == "shared_squadron" and squadron_id != principal.squadron_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Squadron is not authorized")
