# Frontend Plan: Gate Winch DI/Sign-On Behind STARS "Green" Status Check

## 1. Executive Summary

Consume the backend qualifications API (`/operators/me/qualifications` and `/operators/me/qualifications/refresh`) to display a non-blocking STARS status graphic below the Winch Select panel. Conditionally disable winch selection and apply authorization constraints to Daily Inspection (DI), Sign-On, and mid-session trainee assignment panels based on the user's currency states (`green`, `amber`, `blue`, `red`, `nil`).

## 2. Business Rules & Logic Mapping

Qualifications are evaluated purely on the currency state:
- `is_valid(state) = ["green", "amber"].includes(state)`
- **Blue** (requires acknowledgement) and **Red** (expired/lapsed) are invalid.
- **Nil** means the qualification was never held.

### 2.1 Role Capabilities
- `can_solo = is_valid(quals.c005_operator)`: Permits solo winch operations and signing Daily Inspection (DI).
- `can_dual = is_valid(quals.e004_instructor) || is_valid(quals.c003_examiner)`: Permits dual winch operations with a required trainee.
- `has_any_valid = can_solo || can_dual`: Required to select and operate a winch.

## 3. UI / UX Design

### 3.1 Stars Status Graphic Island (`StarsStatusGraphic.tsx`)
- Rendered below `WinchSelectPanel` on the Winch Select view (`view === 'select_winch'`).
- Renders badge cards for all winching qualifications on record:
  - **Operator** (`C005`): 🚜 Winch Operator
  - **Instructor** (`E004`): 🎓 Winch Instructor
  - **Examiner** (`C003`): 🧐 Winch Examiner
  - **Rolling Currency**: 🔄 Skylaunch Winching
- Status Badges use standard themed palette:
  - **Green / Amber**: Valid status chip/badge
  - **Blue / Red**: Disqualified / Expired status chip/badge
- **All-Nil State**: If the operator holds no STARS qualifications (all four states are `nil`), displays an informational card: *"No winching qualifications on record in STARS"*.
- **Refresh Control**: An inline button to trigger `refreshQualifications()`, displaying a loading spinner during re-check and showing the relative timestamp of `last_checked_at`.

### 3.2 Winch Selection Disabling (`WinchSelectPanel.tsx`)
- If `!has_any_valid` (no valid solo or dual qualification held), winch cards remain visible but selection buttons are **disabled**.
- Tooltip/helper text clearly explains: *"No valid winching qualifications held in STARS (Green or Amber required to operate)"*.
- If qualifications are currently loading, buttons reflect loading state or are disabled until resolved.

### 3.3 Form Constraints via Component Props
To respect architectural boundaries (`.oxlintrc.json` forbids cross-feature imports outside `src/app/` and pages), `WinchTab.tsx` coordinates `useQualifications()` and passes capability props down to feature panels:

- **`DailyInspectionPanel.tsx`** (Props: `canSignDI: boolean`):
  - Gated by `can_solo`.
  - If `!can_solo`: Disables the "Sign Inspection" button and displays inline helper text: *"C005 Winch Operator qualification (green or amber) required to sign Daily Inspection."*
- **`SignOnPanel.tsx`** (Props: `canSolo: boolean`, `canDual: boolean`):
  - If `can_dual && !can_solo`: Hides/disables the "— None —" option in trainee selection, forcing selection of a trainee.
  - If `can_solo && !can_dual`: Locks trainee selection to "— None —" and informs the user that solo operators cannot sign on with a trainee.
  - If `can_solo && canDual`: Allows choosing either solo ("— None —") or selecting a trainee.
  - If `!can_solo && !can_dual`: Submit is disabled.
- **`TraineeAssignmentPanel.tsx`** (Props: `canSolo: boolean`):
  - If `!can_solo`: Disables the "— None —" option to prevent an instructor/examiner from stripping the mandatory trainee mid-session.

## 4. Implementation Details (`vikingwinch-frontend/`)

### 4.1 Feature Module: `src/features/qualification/`
1. `types.ts`:
   - `QualificationState = "green" | "amber" | "blue" | "red" | "nil"`
   - `OperatorQualifications`: DTO matching backend response (`service_no`, `stars_resource_id`, `c005_operator`, `e004_instructor`, `c003_examiner`, `rolling_currency`, `last_checked_at`)
2. `api/qualificationClient.ts`:
   - `getQualifications(signal?: AbortSignal): Promise<OperatorQualifications>` -> `GET /operators/me/qualifications`
   - `refreshQualifications(): Promise<OperatorQualifications>` -> `POST /operators/me/qualifications/refresh`
3. `hooks/useQualifications.ts`:
   - Manages `qualifications`, `isLoading`, `isRefreshing`, `error`, `refresh()`.
   - Derives `canSolo`, `canDual`, `hasAnyValid`.
4. `components/StarsStatusGraphic.tsx`:
   - Visual card with qualification emoticons, color-coded status badges, all-nil fallback state, and manual refresh button.
5. Unit tests:
   - `api/qualificationClient.test.ts`
   - `hooks/useQualifications.test.tsx`
   - `components/StarsStatusGraphic.test.tsx`

### 4.2 Cross-Feature Integration: `src/pages/WinchTab.tsx`
- Call `useQualifications()` inside `WinchTabContent`.
- In `select_winch` view: Render `<StarsStatusGraphic />` below `<WinchSelectPanel />`, pass `canSelect={hasAnyValid}` to `WinchSelectPanel`.
- In `inspection` view: Pass `canSignDI={canSolo}` to `<DailyInspectionPanel />`.
- In `sign_on` view: Pass `canSolo={canSolo}` and `canDual={canDual}` to `<SignOnPanel />`.
- In `launch` view: Pass `canSolo={canSolo}` to `<TraineeAssignmentPanel />`.

### 4.3 Architecture & Boundary Hygiene
- Update `.oxlintrc.json` to include `**/features/qualification/**` in the cross-feature restricted imports list.

---

## 5. Implementation Tasks Breakdown

### Task 1: Qualification Client and Types
- Create `src/features/qualification/types.ts`
- Create `src/features/qualification/api/qualificationClient.ts`
- Create `src/features/qualification/api/qualificationClient.test.ts`
- Update `.oxlintrc.json` with `**/features/qualification/**`

### Task 2: useQualifications Hook
- Create `src/features/qualification/hooks/useQualifications.ts`
- Create `src/features/qualification/hooks/useQualifications.test.tsx`

### Task 3: StarsStatusGraphic Component
- Create `src/features/qualification/components/StarsStatusGraphic.tsx`
- Create `src/features/qualification/components/StarsStatusGraphic.test.tsx`

### Task 4: Panel Constraint Integration
- Update `WinchSelectPanel.tsx` + `WinchSelectPanel.test.tsx` (disable buttons when `canSelect=false`)
- Update `DailyInspectionPanel.tsx` + `DailyInspectionPanel.test.tsx` (disable DI sign when `canSignDI=false`)
- Update `SignOnPanel.tsx` + `SignOnPanel.test.tsx` (enforce solo vs dual trainee rules)
- Update `TraineeAssignmentPanel.tsx` + `TraineeAssignmentPanel.test.tsx` (disable removing trainee if `!canSolo`)
- Update `WinchTab.tsx` + `WinchTab.test.tsx` (coordinate `useQualifications`, render `StarsStatusGraphic`, distribute props)
