# Viking Winch Authentication and Authorization

This document describes how authentication works across the Viking Winch frontend, FastAPI backend, and database. The current default provider is Clerk. Microsoft Entra ID through MSAL remains supported in the codebase as an alternative provider, but it is not the normal deployment path at present.

## 1. Security boundaries

The application has three distinct security boundaries:

1. **The identity provider** authenticates the user and issues a signed access token.
2. **The FastAPI backend** validates that token and converts it into an application principal.
3. **The database authorization layer** checks that principal against the requested squadron, winch, and operator records.

The frontend controls the user experience, but it is not trusted to make authorization decisions. The backend repeats the important checks for every protected operation before reading or mutating operational data.

## 2. Clerk flow (current default)

### 2.1 Sign-in

The frontend selects Clerk unless `VITE_AUTH_PROVIDER` is explicitly set to `msal`:

```text
VITE_AUTH_PROVIDER=clerk
```

`src/main.tsx` creates a `ClerkProvider` using the configured publishable key. `src/pages/App.tsx` then uses Clerk hooks to determine whether the user is loaded, signed in, or signed out.

When the user is signed out, the app renders `LoginPage`. When signed in, the
app requests `/operators/me` and opens the operational winch application only
when the authenticated account resolves to one local operator.

### 2.2 API token creation

Clerk authentication and API authentication are separate concepts:

- The Clerk session establishes that the browser user is signed in.
- A Clerk JWT template creates a token intended for the Viking Winch API.

The template name is configurable through `VITE_CLERK_JWT_TEMPLATE` and defaults to `vikingwinch_api`:

```text
VITE_CLERK_JWT_TEMPLATE=vikingwinch_api
```

When `ClerkApp` mounts, it registers a token provider with `setApiTokenProvider`. That provider calls:

```ts
getToken({template: CLERK_JWT_TEMPLATE})
```

The template must produce a token whose issuer, audience, and signing keys match the backend's Clerk configuration:

```text
CLERK_ISSUER=https://your-clerk-issuer
CLERK_AUDIENCE=vikingwinch_api
CLERK_JWKS_URL=https://your-clerk-issuer/.well-known/jwks.json
```

The token only needs to identify the Clerk user. On first sign-in, the backend
uses the verified Clerk `sub` to retrieve the user through the Clerk Backend
API using `CLERK_SECRET_KEY`. The backend reads administrator-managed Clerk
`public_metadata` fields named `operator_sn` and `squadron_id`, validates them
against the local database, and creates or updates the local operator
projection. The local database remains the authorization source after
provisioning.

### 2.3 Attaching the token to requests

All frontend API calls go through `src/core/http/fetchClient.ts`. Before making a request, `apiFetch` asks the registered provider for a token. When a token is available and the caller has not already supplied an `Authorization` header, the client sends:

```http
Authorization: Bearer <access-token>
```

The token provider is cleared when the relevant auth component unmounts. This prevents a stale provider from being used after switching authentication modes or leaving the authenticated app.

## 3. MSAL flow (alternative provider)

When `VITE_AUTH_PROVIDER=msal`, `App.tsx` uses the MSAL account and acquires an API access token silently:

```text
VITE_API_SCOPE=api://your-api-app-id/.default
```

The scope must belong to the same API app registration represented by the backend's:

```text
MSAL_AUDIENCE=api://your-api-app-id
```

The frontend deliberately fails with a configuration error if no API scope is configured. It must not silently request a token for a different audience.

The backend validates the API token, extracts the immutable Entra `oid` and
`tid`, and uses an app-only Microsoft Graph credential to resolve the user's
`employeeId`, `department`, and display name. The backend creates or updates
the local operator projection on first sign-in. The frontend does not make
authorization decisions from a client-side Graph response.

## 4. Backend token validation

The backend implementation is in `backend/auth.py`. Protected routers depend on `get_current_principal`, which performs the following sequence:

1. Require an HTTP Bearer token.
2. Read the token issuer without trusting the token yet.
3. Compare that issuer against the configured Clerk and MSAL issuers.
4. Select the matching provider configuration.
5. Download or reuse the provider's JWKS client.
6. Verify the JWT signature using an allowed asymmetric algorithm.
7. Verify the configured issuer and audience.
8. Require `exp`, `iat`, and `sub` claims.
9. Convert the verified claims into a `Principal`.

The backend does not treat an unverified issuer or any frontend state as authorization. The unverified issuer is only used to select which configured key set and validation settings should be applied. Signature, issuer, audience, and time-based claims are checked afterward.

### 4.1 Failure responses

Authentication failures use standard HTTP semantics:

- `401 Unauthorized`: missing, malformed, expired, unknown-issuer, invalid-signature, invalid-issuer, or invalid-audience token.
- `403 Forbidden`: a valid token exists, but it is not mapped to the required squadron or operator.
- `503 Service Unavailable`: the server is missing provider configuration or cannot retrieve signing keys.

The backend logs rejection reasons without logging token contents.

## 5. The application principal

After validation, the backend represents the caller with the immutable `Principal` dataclass:

```python
Principal(
    provider="clerk",
    mode="individual_operator",
    subject="provider-subject",
    squadron_id="123 VGS",
    operator_sn="SGT-2005",
)
```

The application uses one authorization mode. Provider identity resolution
produces one local operator:

```text
provider=clerk or msal
mode=individual_operator
operator_sn=<local operator service number>
squadron_id=<local operator squadron>
```

The `test` provider is only used by the test dependency override and bypasses
authorization checks after authentication dependencies have been wired into the
routers.

## 6. Route protection

The domain routers attach `Depends(get_current_principal)` at router level. This means all endpoints in the following groups require a bearer token:

- day-log routes
- launch routes
- operator routes
- squadron routes
- winch routes

Endpoints also receive the principal explicitly when they need resource-level authorization. This keeps authentication and authorization separate:

- Router dependency: “Is there a valid authenticated principal?”
- Authorization helper: “Can this principal access this exact resource?”

The `/health` endpoint is intentionally separate and remains usable for service/database health checks. It checks database connectivity, not user authentication.

## 7. Resource-level authorization rules

### Winches

`authorize_winch` loads the winch and checks its squadron:

- Individual-operator principals may access only winches in the resolved
  operator's squadron.

This check is applied to winch reads, day-log operations, launch creation, launch correction, launch listing, remarks, repairs, and launch deletion.

### Operators

`authorize_operator` ensures the requested operator exists and matches the caller's authorization:

- An individual-operator principal may access only the operator represented by its token when an operator is supplied as an action actor.
- Individual users may read other operators in their own squadron where the
  operational workflow needs trainee, worker, or supervisor records.

Launches and day logs also validate that the submitted operator and squadron match the authorized winch. This prevents a caller from supplying an otherwise valid operator or squadron belonging to another resource.

### Squadrons

`authorize_squadron` limits individual-operator principals to their resolved
local squadron.

## 8. Configuration responsibilities

### Backend

The backend needs a complete configuration for at least one provider. A partially configured provider is rejected at startup/request time rather than silently ignored.

For Clerk:

```text
CLERK_ISSUER=...
CLERK_AUDIENCE=...
CLERK_JWKS_URL=...
CLERK_SECRET_KEY=...
```

For optional MSAL:

```text
MSAL_ISSUER=...
MSAL_AUDIENCE=...
MSAL_JWKS_URL=...
MSAL_GRAPH_TENANT_ID=...
MSAL_GRAPH_CLIENT_ID=...
MSAL_GRAPH_CLIENT_SECRET=...
```

`CORS_ALLOWED_ORIGINS` is a comma-separated allowlist. If set, it replaces the local default list. Production deployments should set it explicitly to the deployed frontend origin.

### Frontend

The Clerk frontend needs:

```text
VITE_AUTH_PROVIDER=clerk
VITE_CLERK_JWT_TEMPLATE=vikingwinch_api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
VITE_API_URL=...
```

Each Clerk user must have an individual account. An administrator must set
`public_metadata.operator_sn` and `public_metadata.squadron_id` in Clerk;
the first authenticated API request then creates the local operator row with
`auth_provider='clerk'` and the Clerk user ID in `auth_subject`. Existing
operators are refreshed from the Clerk profile on sign-in. Shared squadron
credentials are not supported after cutover, and the frontend no longer asks
the user to select an operator.

The optional MSAL frontend needs:

```text
VITE_AUTH_PROVIDER=msal
VITE_AZURE_CLIENT_ID=...
VITE_AZURE_TENANT_ID=...
VITE_API_SCOPE=api://<api-app-id>/.default
```

The API scope and backend audience must refer to the same API registration.

## 9. CORS versus authentication

CORS is a browser-origin policy, not an authentication mechanism. It controls which browser origins may read responses from the API. A non-browser client can still send requests without CORS being involved, so every protected API route must continue to validate its bearer token.

The backend's built-in defaults now allow only the local Vite origin:

```text
http://localhost:5173
http://127.0.0.1:5173
```

The deployed frontend origin should be supplied through `CORS_ALLOWED_ORIGINS`; it is not hard-coded into the application defaults.

## 10. End-to-end request sequence

For the default Clerk path, a protected request follows this sequence:

```text
User creates or signs in with an individual Clerk account
        |
        v
Clerk session is available in the React app
        |
        v
getToken({ template: "vikingwinch_api" })
        |
        v
apiFetch adds Authorization: Bearer <JWT>
        |
        v
FastAPI HTTPBearer extracts the token
        |
        v
backend selects Clerk config from the token issuer
        |
        v
JWT signature, issuer, audience, exp, iat, and sub are verified
        |
        v
the backend resolves the Clerk subject to a database operator
        |
        v
route authorization checks squadron/winch/operator ownership
        |
        v
repository reads or writes the database
```

At no point does the backend trust browser-selected operator, squadron, or
Graph profile data as proof of authorization. Provider identity is resolved
server-side to the local operator and squadron records.

## 11. Operational checklist

Before deploying the authenticated stack:

1. Configure the backend issuer, audience, and JWKS URL for the selected provider.
2. Configure the frontend API URL and provider credentials.
3. Ensure the Clerk JWT template's audience matches `CLERK_AUDIENCE`.
4. Set each Clerk user's administrator-managed `public_metadata.operator_sn`
   and `public_metadata.squadron_id`.
5. For MSAL, configure Graph app-only credentials and grant least-privilege
   directory-read permission.
6. Set `CORS_ALLOWED_ORIGINS` to the exact deployed frontend origin.
7. Confirm the frontend sends an `Authorization` header to a protected endpoint.
8. Confirm requests without a token receive `401`.
9. Confirm a valid user from another squadron receives `403` for the protected resource.
10. Keep `/health` available for platform health checks, but do not use it as proof that protected business routes are accessible.
