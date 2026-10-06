# Frontend Plan: Gate Winch DI/Sign-On Behind STARS "Green" Status Check

## 1. Executive Summary

Consume the backend qualifications API to display a non-blocking STARS status graphic below the Winch Select panel.
Conditionally disable winches and modify the Sign-On / DI panels based on the raw currency states (green, amber, blue,
red, nil).

## 2. UI / UX Design

### 2.1 Stars Status Graphic Island

- Rendered below the Winch Select panel on the main page.
- Displays all qualifications the user has ever been authorized for (ignores `nil`).
- Status Badges use standard colors (Green, Amber, Blue, Red).
- Custom emoticons:
    - **Operator** (`C005`): 🚜 Normal Winch
    - **Instructor** (`E004`): 🎓 Teacher Winch
    - **Examiner** (`C003`): 🧐 Professor/Examiner Winch
- Includes an optional manual "Refresh status" button to call the backend refresh endpoint.
- Existing toolbar user button handles logouts.

### 2.2 Winch Selection Disabling

- If the user has no valid qualifications (all non-nil are blue/red), the winches in the Winch Select panel remain
  visible but the selection buttons are **disabled**.
- Tooltips explain why (e.g., "Qualifications not in the green").
- This ensures users are aware of their status before being unexpectedly blocked.

## 3. Implementation Details (`vikingwinch-frontend/`)

### 3.1 Feature Module (`src/features/qualification/`)

- `types.ts`: `QualificationState = "green" | "amber" | "blue" | "red" | "nil"`
- `api/qualificationClient.ts`: `getQualifications()`, `refreshQualifications()`
- `hooks/useQualifications.ts`: React Query or standard fetch hook with background refetch support.
- `components/StarsStatusGraphic.tsx`: Visual island card.
- Update `.oxlintrc.json` to allow imports from this new feature slice.

### 3.2 Conditional Form Constraints

Using `is_valid = (state) => ["green", "amber"].includes(state)`:

- **`DailyInspectionPanel.tsx`**:
    - If `!is_valid(quals.c005_operator)`: Disable the "Sign Inspection" button and display inline help text.

- **`SignOnPanel.tsx`**:
    - `can_solo = is_valid(quals.c005_operator)`
    - `can_dual = is_valid(quals.e004_instructor) || is_valid(quals.c003_examiner)`
    - If `can_dual && !can_solo`: Hide/disable the "No Trainee" option, forcing selection.
    - If `can_solo && !can_dual`: Disable trainee dropdown or hide it entirely.

- **`TraineeAssignmentPanel.tsx`**:
    - If `!is_valid(quals.c005_operator)`: Disable the "— None —" option to prevent stripping the required trainee
      mid-session.
