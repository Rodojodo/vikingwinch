# Backend Plan: Gate Winch DI/Sign-On Behind STARS "Green" Status Check

## 1. Executive Summary

Integrate the backend with the STARS API to fetch and cache user winching qualifications. Expose these currency states
(green, amber, blue, red, nil) to the frontend and enforce them server-side for Daily Inspection (DI), Sign-On, and
Launch operations.

## 2. Business Rules

Qualifications are evaluated purely on the `currencyState` field (green, amber, blue, red). If a user has never had a
qualification, the state is `nil`.

- **Blue** means the qualification needs to be acknowledged. Functionally equivalent to **Red** (disqualified).
- **Green/Amber** are valid.

### 2.1 Currency Map

- **Operator** (`C005 SYE Skylaunch Winch Operator`): Solo winch operation. Permits Daily Inspection (DI).
- **Instructor** (`E004 SYE Skylaunch Winch Instructor`): Dual operation only (trainee required).
- **Examiner** (`C003 SYE Skylaunch Winch Examiner`): Dual operation only (trainee required).
- **Skylaunch Winching**: Rolling currency.

## 3. Implementation Details (`backend/`)

### 3.1 Database Model (`backend/domain/stars/model.py`)

Create a new table `operator_qualifications`:

- `service_no` (PK, FK to `operators.service_no`)
- `stars_resource_id` (String (50), nullable)
- `c005_operator` (String (10), default='nil')
- `e004_instructor` (String (10), default='nil')
- `c003_examiner` (String (10), default='nil')
- `rolling_currency` (String (10), default='nil')
- `last_checked_at` (DateTime, UTC)

### 3.2 STARS Client (`backend/domain/stars/client.py`)

Implement `StarsClient` utilizing the provided F12-reverse-engineered code:

- Use `requests` with `STARS_API_KEY` from environment.
- Functions (copied exactly as provided): `get_people_for_unit(unit_id)`, `get_eng_auths_for_user(resource_id)`.
- Support `STARS_MOCK_MODE=true` for local development.

### 3.3 API Endpoints (`backend/domain/stars/router.py`)

- `GET /operators/me/qualifications`: Returns current `operator_qualifications` for the user. Triggers a live
  fetch/upsert if cache > 7 days old.
- `POST /operators/me/qualifications/refresh`: Forces immediate live re-check.

### 3.4 Authorization Enforcement (`backend/domain/day_log/router.py`)

Minimalist business logic check based on the pure currency states:

```python
def is_valid(state: str) -> bool:
    return state in ["green", "amber"]

# In create_day_log (for type == "di"):
if not is_valid(quals.c005_operator):
    raise HTTPException(403, "C005 Winch Operator green/amber required for Daily Inspection.")

# In create_day_log (for type == "sign_on"):
can_solo = is_valid(quals.c005_operator)
can_dual = is_valid(quals.e004_instructor) or is_valid(quals.c003_examiner)

if not can_solo and not can_dual:
    raise HTTPException(403, "No valid winching qualifications held.")
if not can_dual and payload.trainee is not None:
    raise HTTPException(400, "Solo operators cannot sign on with a trainee.")
if not can_solo and payload.trainee is None:
    raise HTTPException(400, "Instructors/Examiners must sign on with a trainee.")
```
