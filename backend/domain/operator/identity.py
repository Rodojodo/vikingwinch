from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import quote

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.operator.model import Operator
from domain.squadron.model import Squadron


@dataclass(frozen=True)
class GraphOperator:
    service_no: str
    name: str
    squadron_id: str


async def _get_clerk_operator(subject: str) -> GraphOperator:
    secret_key = os.getenv("CLERK_SECRET_KEY")
    if not secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk provisioning is not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{quote(subject, safe='')}",
                headers={"Authorization": f"******"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk is unavailable",
        ) from exc

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user was not found in Clerk",
        )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk rejected the provisioning request",
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk returned an invalid response",
        ) from exc

    metadata = data.get("public_metadata")
    if not isinstance(metadata, dict):
        metadata = {}
    service_no = str(metadata.get("operator_sn") or metadata.get("service_no") or "").strip()
    squadron_id = str(metadata.get("squadron_id") or "").strip()
    name = " ".join(
        part.strip()
        for part in (data.get("first_name"), data.get("last_name"))
        if isinstance(part, str) and part.strip()
    ) or str(data.get("username") or "").strip()
    if not service_no or not squadron_id or not name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clerk profile is missing operator or squadron data",
        )
    return GraphOperator(service_no=service_no, name=name, squadron_id=squadron_id)


async def _get_graph_operator(subject: str, tenant_id: str) -> GraphOperator:
    configured_tenant = os.getenv("MSAL_GRAPH_TENANT_ID")
    client_id = os.getenv("MSAL_GRAPH_CLIENT_ID")
    client_secret = os.getenv("MSAL_GRAPH_CLIENT_SECRET")
    if not configured_tenant or not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MSAL Graph provisioning is not configured",
        )
    if configured_tenant != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated tenant is not authorized",
        )

    try:
        from azure.identity.aio import ClientSecretCredential

        credential = ClientSecretCredential(
            tenant_id=configured_tenant,
            client_id=client_id,
            client_secret=client_secret,
        )
        try:
            access_token = (await credential.get_token("https://graph.microsoft.com/.default")).token
        finally:
            await credential.close()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to obtain Microsoft Graph credentials",
        ) from exc

    url = f"https://graph.microsoft.com/v1.0/users/{subject}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                params={"$select": "id,displayName,employeeId,department"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Microsoft Graph is unavailable",
        ) from exc

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user was not found in Microsoft Graph",
        )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Microsoft Graph rejected the provisioning request",
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Microsoft Graph returned an invalid response",
        ) from exc
    service_no = str(data.get("employeeId") or "").strip()
    squadron_id = str(data.get("department") or "").strip()
    name = str(data.get("displayName") or "").strip()
    if not service_no or not squadron_id or not name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Microsoft Graph profile is missing operator or squadron data",
        )
    return GraphOperator(service_no=service_no, name=name, squadron_id=squadron_id)


async def resolve_operator(
    db: AsyncSession,
    provider: str,
    subject: str,
    tenant_id: str | None,
) -> Operator:
    identity_tenant_id = tenant_id or ""
    identity_query = select(Operator).where(
        Operator.auth_provider == provider,
        Operator.auth_subject == subject,
        Operator.auth_tenant_id == identity_tenant_id,
    )
    operator = await db.scalar(identity_query)

    if provider == "clerk":
        provider_operator = await _get_clerk_operator(subject)
    elif provider == "msal" and tenant_id:
        provider_operator = await _get_graph_operator(subject, tenant_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated identity cannot be provisioned",
        )

    squadron = await db.get(Squadron, provider_operator.squadron_id)
    if squadron is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator's squadron is not configured",
        )

    service_number_operator = await db.scalar(
        select(Operator).where(Operator.service_no == provider_operator.service_no)
    )
    if service_number_operator is not None and service_number_operator is not operator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator service number is already linked to another identity",
        )
    if operator is not None and operator.service_no != provider_operator.service_no:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider operator number does not match the linked identity",
        )

    if operator is None:
        operator = Operator(
            service_no=provider_operator.service_no,
            auth_provider=provider,
            auth_subject=subject,
            auth_tenant_id=identity_tenant_id,
            name=provider_operator.name,
            squadron_id=provider_operator.squadron_id,
            qualification_level="operator",
        )
        db.add(operator)
    else:
        operator.name = provider_operator.name
        operator.squadron_id = provider_operator.squadron_id
        operator.auth_provider = provider
        operator.auth_subject = subject
        operator.auth_tenant_id = identity_tenant_id

    await db.commit()
    await db.refresh(operator)
    return operator
