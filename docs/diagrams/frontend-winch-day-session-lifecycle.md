# Winch-Day session lifecycle

Source of truth: `vikingwinch-frontend/src/app/types/session.ts` and
`vikingwinch-frontend/src/pages/WinchTab.tsx`.

## The `SessionStatus` Discriminated Union

Session status is tracked as a discriminated union in
`src/app/types/session.ts` and distributed via `SessionIdentityProvider`:

```typescript
export type SessionStatus =
    | { status: 'unselected' }
    | { status: 'hydrating'; winchId: number }
    | { status: 'open'; winchId: number }
    | { status: 'closed'; winchId: number };
```

Every winch tab transitions linearly through these states:
`unselected` → `hydrating` → `open` (or directly to `closed` if historical
day logs already contain a `finish_day` entry) → `closed`.

---

## Session Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    actor Operator
    participant Tab as WinchTab
    participant Identity as SessionIdentityProvider
    participant Content as WinchTabContent
    participant Backend as Backend API (DayLog / Launch / Ops)
    participant LaunchOps as LaunchOpsProvider (launchReducer)
    participant TraineeOps as TraineeOpsProvider (traineeReducer)
    participant DayOps as DayOpsProvider (dayReducer)

    %% Background Squadron Operators Fetch
    Note over Tab,Backend: Background: Squadron Operators Hook (keyed on squadronId)
    Content ->> Backend: getOperatorsForSquadron(squadronId) [AbortController signal]
    Backend -->> Content: operators list

    %% 1. Unselected State
    Note over Tab,Identity: 1. Unselected State
    Tab ->> Identity: Mount: status: { status: 'unselected' }
    Tab ->> Content: renderView() => 'select_winch' (WinchSelectPanel)
    Operator ->> Content: Select Winch (newWinchId)

    %% 2. Selection & Hydration Phase
    Note over Tab,Identity: 2. Hydration Phase (keyed on winchId)
    Content ->> Tab: onWinchSelect(tabId, newWinchId)
    Tab ->> Identity: setSessionStatus({ status: 'hydrating', winchId: newWinchId })
    Tab ->> Content: renderView() => 'loading'
    
    Note over Content,Backend: Parallel Data Fetch (Promise.all in fetchDayLog)
    par Winch Day Data Fetch
        Content ->> Backend: getDayLog(winchId, todayStr)
    and
        Content ->> Backend: getLaunches(winchId, todayStr)
    end

    alt Hydration Success
        Backend -->> Content: rawLogs, rawLaunches
        Content ->> LaunchOps: hydrateHistory(launches)
        LaunchOps ->> LaunchOps: dispatch({ type: 'HYDRATE_HISTORY', payload: { left, right } })
        Content ->> TraineeOps: setTrainee(lastTrainee)
        TraineeOps ->> TraineeOps: dispatch({ type: 'SET_TRAINEE', payload: { traineeSn, ... } })

        alt Day contains finish_day log
            Content ->> Tab: onSessionStatusResolved('closed')
            Tab ->> Identity: setSessionStatus({ status: 'closed', winchId })
        else Day is active
            Content ->> Tab: onSessionStatusResolved('open')
            Tab ->> Identity: setSessionStatus({ status: 'open', winchId })
        end

        alt Inspection needed (!hasDiToday)
            Content ->> Content: setView('inspection') [DailyInspectionPanel]
        else Sign-on needed (no signOnLogs or operator mismatch)
            Content ->> Content: setView('sign_on') [SignOnPanel]
        else Ready for launching
            Content ->> Content: setView('launch') [LaunchPanel]
        end

    else Hydration Failure (Network / Server Error)
        Backend -->> Content: Error / Rejection
        Note over Content: Hydration error caught gracefully
        Content ->> Content: console.error('Failed to fetch day logs', err)
        Content ->> Tab: onSessionStatusResolved('open')
        Tab ->> Identity: setSessionStatus({ status: 'open', winchId })
        Content ->> Content: setView('inspection') [Fallback to DI Panel]
    end

    %% 3. Active Operations (Open State)
    Note over Operator,DayOps: 3. Active Operations (Open State)
    opt Daily Inspection
        Operator ->> Content: Complete DI checklist & submit hours
        Content ->> DayOps: recordDI(null, hours)
        DayOps ->> Backend: POST /winch/{id}/day_log (type: 'di')
        DayOps ->> DayOps: dispatch({ type: 'RECORD_DI' })
        Content ->> Content: setView('sign_on')
    end

    opt Operator Sign-On
        Operator ->> Content: Confirm walkaround & sign-on
        Content ->> DayOps: recordSignOn(traineeSn)
        DayOps ->> Backend: POST /winch/{id}/day_log (type: 'sign_on')
        DayOps ->> DayOps: dispatch({ type: 'RECORD_SIGN_ON', payload: { ... } })
        Content ->> Content: setView('launch')
    end

    opt Flight Launches & Remarks
        Operator ->> Content: Click Left/Right Drum Launch
        Content ->> LaunchOps: executeLaunch(drum, burn)
        LaunchOps ->> Backend: POST /launches
        LaunchOps ->> LaunchOps: dispatch({ type: 'RECORD_LAUNCH', ... })
    end

    opt Review Skylog Values
        Operator ->> Content: Click "Show skylog values"
        Content ->> Content: setView('skylog') [SkylogValues]
        Operator ->> Content: Click "Back"
        Content ->> Content: setView('launch')
    end

    %% 4. Day Finish (Closure Phase)
    Note over Operator,Identity: 4. Session Closure (Closed State)
    Operator ->> Content: Finish Day (FinishDayPanel)
    Content ->> DayOps: finishDay(details)
    DayOps ->> Backend: POST /winch/{id}/day_log (type: 'finish_day')
    DayOps ->> DayOps: dispatch({ type: 'FINISH_DAY' })
    DayOps ->> Tab: onDayFinished()
    Tab ->> Identity: setSessionStatus({ status: 'closed', winchId })
    Content ->> Content: UI reflects closed status; exportLog available
```

---

## State Transition Details

### 1. `unselected`
- **Initial condition:** The user has opened the winch tab, but no winch has
  been assigned (`winchId === null`).
- **Rendered View:** `WinchSelectPanel` displaying available winches filtered
  by squadron.
- **Allowed Actions:** Selecting a winch via `onWinchSelect(tabId, newWinchId)`.

### 2. `hydrating`
- **Trigger:** Winch selection or tab switch to a selected winch.
- **Immediate State:** Status becomes `{ status: 'hydrating', winchId }`, and
  the view changes to `loading` (spinner).
- **Data Fetching Architecture:**
  - **Squadron Operators Hook:** Handled by an independent `useEffect` keyed on
    `squadronId`. When `squadronId` is present, it invokes
    `getOperatorsForSquadron(squadronId, controller.signal)` with an
    `AbortController` to cancel in-flight requests on unmount or squadron changes.
  - **Winch Session Hydration:** Handled by a dedicated `fetchDayLog` function
    inside a `useEffect` keyed on `winchId`. It executes parallel requests via
    `Promise.all([ getDayLog(winchId, todayStr), getLaunches(winchId, todayStr) ])`.
  - Historical launches are partitioned into left and right drums and
    hydrated into `launchReducer` via `hydrateHistory`.
  - The last active trainee is restored into `traineeReducer` via `setTrainee`.
- **Resolution:**
  - If a `finish_day` log exists for today, the session immediately resolves
    to `{ status: 'closed', winchId }`.
  - Otherwise, it resolves to `{ status: 'open', winchId }`.
- **Failure Handling:** If the network request fails, the error is caught,
  the session falls back to `{ status: 'open', winchId }`, and the view routes
  to `inspection` so the operator is not permanently locked out.

### 3. `open`
- **Condition:** Winch is hydrated and the day has not yet been closed.
- **Sub-flow Routing (`TabView`):**
  1. `inspection` (`DailyInspectionPanel`): Shown if no Daily Inspection (`di`)
     log exists for today.
  2. `sign_on` (`SignOnPanel`): Shown if inspection exists, but no sign-on log
     exists for the current operator.
  3. `launch` (`LaunchPanel`): Main operations view displaying drum controls,
     counters, launch history, remarks/repairs panels, and the trainee wing.
  4. `skylog` (`SkylogValues`): Full-panel summary displaying cumulative launch
     counts and details for logbook synchronization; provides an `onBack`
     action returning to `'launch'`.
- **Allowed Operations:** Dispatching launches, logging remarks, viewing skylog
  values, signing on crew, and finishing the day.

### 4. `closed`
- **Trigger:** Either hydrated from a historical `finish_day` log, or
  triggered during active operations via `FinishDayPanel`.
- **State Effect:** Status becomes `{ status: 'closed', winchId }`.
- **System Behavior:**
  - Day operations are finalized.
  - The day log spreadsheet export (`exportLog`) is enabled.
  - Prevents subsequent modifications to the finalized day session.
