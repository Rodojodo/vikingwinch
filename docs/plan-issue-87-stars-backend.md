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

## Global Constraints
- Python 3.14 compatible async code with FastAPI and SQLAlchemy
- Test runner: `.venv/bin/pytest`
- Pure currency evaluation: only `"green"` and `"amber"` are valid; `"blue"`, `"red"`, `"nil"` are invalid.

## Review Focus
- Database integrity: `operator_qualifications` foreign key and cascade behavior with `operators`.
- Handling missing/unknown operators in STARS gracefully (defaulting to "nil" instead of raising 500).
- Mock mode (`STARS_MOCK_MODE=true`) works completely offline without network requests.
- Cache TTL calculation (7 days) handles timezone awareness correctly (UTC).
- Enforcement checks on DI and Sign-On return 403 Forbidden with exact descriptive errors.

---

### Task 1: Database Model and Repository

**Files:**
- Create: `backend/domain/stars/model.py`
- Create: `backend/domain/stars/schema.py`
- Create: `backend/domain/stars/repository.py`
- Create: `backend/domain/stars/test_repository.py`
- Modify: `backend/alembic/env.py`

**Interfaces:**
- Consumes: `backend/domain/operator/model.py` (`Operator`)
- Produces:
  - `OperatorQualifications` model with fields:
    `service_no`, `stars_resource_id`, `c005_operator`, `e004_instructor`, `c003_examiner`, `rolling_currency`, `last_checked_at`
  - `OperatorQualificationsRead` schema
  - `get_qualifications_by_sn(db: AsyncSession, service_no: str) -> OperatorQualifications | None`
  - `upsert_qualifications(db: AsyncSession, service_no: str, ...) -> OperatorQualifications`

- [ ] **Step 1: Write failing tests for repository and model**
- [ ] **Step 2: Run tests to verify failure**
Run: `.venv/bin/pytest backend/domain/stars/test_repository.py -v`
Expected: FAIL (module not found)
- [ ] **Step 3: Implement model, schema, repository, and register in Alembic env**
- [ ] **Step 4: Run tests to verify pass**
Run: `.venv/bin/pytest backend/domain/stars/test_repository.py -v`
Expected: PASS
- [ ] **Step 5: Commit changes**
Commit: `feat(stars): add operator qualifications model and repository`

---

### Task 2: STARS Client

**Files:**
- Create: `backend/domain/stars/client.py`
- Create: `backend/domain/stars/test_client.py`

**Interfaces:**
- Consumes: None
- Produces:
  - `StarsClient` with:
    - `get_people_for_unit(unit_id: int) -> list[dict]`
    - `get_eng_auths_for_user(resource_id: str, base_date: str | None) -> dict`
    - `get_currencies_for_user(resource_id: str, base_date: str | None) -> dict`
    - `fetch_user_qualifications(service_no: str, unit_id: int) -> dict`
  - Mock mode support via `STARS_MOCK_MODE=true` environment variable

- [ ] **Step 1: Write failing tests for StarsClient**
- [ ] **Step 2: Run tests to verify failure**
Run: `.venv/bin/pytest backend/domain/stars/test_client.py -v`
Expected: FAIL (module not found)
- [ ] **Step 3: Implement StarsClient with real HTTP calls & mock mode**
- [ ] **Step 4: Run tests to verify pass**
Run: `.venv/bin/pytest backend/domain/stars/test_client.py -v`
Expected: PASS
- [ ] **Step 5: Commit changes**
Commit: `feat(stars): implement StarsClient with mock mode and qualification parsing`

---

### Task 3: API Endpoints and Caching

**Files:**
- Create: `backend/domain/stars/service.py`
- Create: `backend/domain/stars/router.py`
- Create: `backend/domain/stars/test_router.py`
- Modify: `backend/main.py`

**Interfaces:**
- Consumes:
  - `backend/domain/stars/repository.py`
  - `backend/domain/stars/client.py`
- Produces:
  - `GET /operators/me/qualifications` (checks cache, refreshes if older than 7 days)
  - `POST /operators/me/qualifications/refresh` (forces immediate live re-check)

- [ ] **Step 1: Write failing tests for qualifications API endpoints**
- [ ] **Step 2: Run tests to verify failure**
Run: `.venv/bin/pytest backend/domain/stars/test_router.py -v`
Expected: FAIL (route not found / 404)
- [ ] **Step 3: Implement service, router, and register in main.py**
- [ ] **Step 4: Run tests to verify pass**
Run: `.venv/bin/pytest backend/domain/stars/test_router.py -v`
Expected: PASS
- [ ] **Step 5: Commit changes**
Commit: `feat(stars): add qualifications api endpoints and caching service`

---

### Task 4: Authorization Enforcement on DI and Sign-On

**Files:**
- Modify: `backend/domain/day_log/router.py`
- Create / Modify: `backend/domain/day_log/test_router.py`

**Interfaces:**
- Consumes:
  - `backend/domain/stars/repository.py`
- Produces:
  - Enforcement of winching qualifications in `POST /winch/{winch_id}/day_log`:
    - DI requires valid C005 (green/amber) -> 403 if invalid
    - Solo sign_on requires valid C005, cannot have trainee -> 403 or 400
    - Dual sign_on requires valid E004 or C003, must have trainee -> 403 or 400

- [ ] **Step 1: Write failing tests for DI and Sign-On qualification enforcement**
- [ ] **Step 2: Run tests to verify failure**
Run: `.venv/bin/pytest backend/domain/day_log/test_router.py -v`
Expected: FAIL (enforcement not yet implemented)
- [ ] **Step 3: Implement qualification checks in day_log router**
- [ ] **Step 4: Run tests to verify pass**
Run: `.venv/bin/pytest backend/domain/day_log/test_router.py -v`
Expected: PASS
- [ ] **Step 5: Commit changes**
Commit: `feat(day_log): gate di and sign on behind stars qualification checks`
