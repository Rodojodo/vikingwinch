# ADR 0002: Composed Reducer per Aggregate Root

## Context

Following the vertical-slice refactoring (#88, #92) and strict TypeScript
enablement (#96), the Viking Winch frontend is organized into decoupled feature
slices under `src/features/` (`auth`, `day-ops`, `launch-ops`,
`remarks-repairs`, `trainee-ops`, `winch-ops`). Cross-feature imports are
strictly prohibited by Oxlint's `no-restricted-imports` rule.

However, several business workflows involve data and state invariants that span
multiple feature slices:

1. **Launch Remarks (`remarks/added` domain event → `ADD_REMARK` action):**
   The `remarks-repairs` feature provides UI panels to record launch remarks
   and maintenance items. When a remark is submitted via
   `POST /launches/remarks`, the remark string must be attached to the
   corresponding launch entity (`LaunchRecord.remark`). Launch history
   (`leftHistory`, `rightHistory`) is owned by `launch-ops`. If reducers were
   strictly organized 1:1 with UI features, `remarks-repairs` would either
   need to duplicate launch history state or import and mutate state across
   feature boundaries.

2. **Crew and Trainee Assignments (`crew/traineeChanged` domain event → `SET_TRAINEE` action):**
   The `trainee-ops` feature allows an instructor to assign a trainee pilot
   and select who is actively driving the winch (`activeLauncherSn`). This state
   directly impacts `launch-ops`, which must assign the effective operator
   service number (`traineeSnOverride ?? activeLauncherSn ?? operatorSn`) when
   dispatching launches, and `day-ops`, which logs trainee service numbers
   during walkaround sign-on (`RECORD_SIGN_ON`).

3. **Day Lifecycle Invariants:**
   Finishing a day in `day-ops` (`FINISH_DAY`) closes the operational session,
   transitioning the global session status in `src/app/types/session.ts` to
   `closed`, which locks out further launch mutations and enables spreadsheet
   export. Similarly, resetting the day (`RESET_DAY`) restores initial day state.

The architectural choice is between:
- **Option A (One reducer per UI feature slice):** Every slice owns an isolated
  reducer containing only its UI-specific state. Slices must synchronize state
  via cross-feature event buses or replicated data stores.
- **Option B (One composed reducer per aggregate root):** Reducers are organized
  around business aggregate roots (`launch`, `crew/trainee`, `day`). Cross-slice
  coordination is orchestrated at the application/page composition layer
  (`src/pages/WinchTab.tsx`).

## Decision

We adopt **Option B: One composed reducer per aggregate root**.

- **Aggregate Root Ownership:**
  - **Launch Aggregate (`launchReducer` in `src/features/launch-ops/state/launchReducer.ts`):**
    Owns the full launch aggregate root, comprising `leftHistory` and
    `rightHistory`. All entity mutations on launches — including recording a
    launch (`RECORD_LAUNCH`), undoing a launch (`UNDO_LAUNCH`), hydrating
    history (`HYDRATE_HISTORY`), and appending a remark (`ADD_REMARK`, handling
    the `remarks/added` domain event) — are handled within `launchReducer`.
  - **Crew/Trainee Aggregate (`traineeReducer` in `src/features/trainee-ops/state/traineeReducer.ts`):**
    Owns crew operational roles, maintaining `traineeSn` and `activeLauncherSn`.
    Actions `SET_TRAINEE` (handling the `crew/traineeChanged` domain event) and
    `SET_ACTIVE_LAUNCHER` encapsulate the invariant that selecting a new
    trainee automatically synchronizes the active launcher to the supervising
    instructor unless explicitly overridden.
  - **Day Operations Aggregate (`dayReducer` in `src/features/day-ops/state/dayReducer.ts`):**
    Owns daily operational milestones, managing `dayFinished`, `signedOn`,
    `diCompleted`, `lastOperatorSn`, and `lastTraineeSn`. It handles
    `FINISH_DAY`, `RECORD_SIGN_ON`, `RECORD_DI`, and `RESET_DAY`.

- **Domain Event to Action Mapping:**

  | Domain Event | Action Discriminator | Aggregate Reducer | Invariant Enforced |
  |---|---|---|---|
  | `remarks/added` | `ADD_REMARK` | `launchReducer` | Updates remark on target `LaunchRecord` within drum history |
  | `crew/traineeChanged` | `SET_TRAINEE` | `traineeReducer` | Synchronizes trainee SN and resets active launcher to instructor |
  | `day/signedOn` | `RECORD_SIGN_ON` | `dayReducer` | Sets `signedOn: true`, records operator and trainee SNs |
  | `day/diCompleted` | `RECORD_DI` | `dayReducer` | Sets `diCompleted: true` |
  | `day/finished` | `FINISH_DAY` | `dayReducer` | Sets `dayFinished: true` |
  | `day/reset` | `RESET_DAY` | `dayReducer` | Restores `initialDayOpsState` |

- **Composition Layer Orchestration:**
  Feature slices never import sibling reducers or state directly. Instead,
  coordination occurs at the application page boundary (`src/pages/WinchTab.tsx`):
  - `WinchTab` nests the providers hierarchically:
    `SessionIdentityProvider` → `DayOpsProvider` → `TraineeOpsProvider` → `LaunchOpsProvider`.
  - `LaunchOpsProvider` accepts `activeLauncherSn` and `traineeSn` as props
    passed down from `TraineeOpsProvider`.
  - `WinchTabContent` bridges remarks: `RemarksRepairsPanel` accepts an
    `addRemark` callback that submits to the backend via `remarksClient` and
    then calls `addRemarkToState` from `useLaunchOps()`.
  - `DayOpsProvider` accepts an `onDayFinished` callback that transitions
    `SessionStatus` in `SessionIdentityProvider`.

- **Pure Reducers and Identity Preservation:**
  Each aggregate reducer remains a pure function `(state, action) => state`.
  On unhandled actions or no-op updates, reducers MUST preserve object
  reference identity (`return state`) to prevent re-render cascades across
  context consumers.

## Consequences

- **Single Source of Truth:** Launch entities and their remarks exist in exactly
  one place (`LaunchState`). There is no data duplication between `launch-ops`
  and `remarks-repairs`.
- **Strict Oxlint Compliance:** No horizontal imports between feature slices are
  required. The Oxlint `no-restricted-imports` rule passes cleanly without
  exceptions.
- **Encapsulated Invariants:** Aggregate invariants (such as popping the last
  launch on undo, or updating remark text on a specific launch ID) are enforced
  deterministically in pure reducer functions.
- **Isolated Unit Testing:** Because aggregate reducers are pure functions
  independent of React or network clients, they can be tested exhaustively
  using fast, deterministic unit tests (e.g. `launchReducer.test.ts`,
  `traineeReducer.test.ts`, `dayReducer.test.ts`).
- **Composition Boilerplate:** Cross-feature interactions require explicit
  callbacks and prop threading through page-level orchestrators (`WinchTab.tsx`).
  If the application grows significantly, a unified root reducer or typed event
  dispatcher may be considered, but aggregate root boundaries must remain intact.
