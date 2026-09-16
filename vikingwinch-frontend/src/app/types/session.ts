export type SessionStatus =
    | { status: 'unselected' }
    | { status: 'hydrating'; winchId: number }
    | { status: 'open'; winchId: number }
    | { status: 'closed'; winchId: number };
