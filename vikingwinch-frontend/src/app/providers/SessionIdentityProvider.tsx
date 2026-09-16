import React, { useMemo } from 'react';
import type { SessionStatus } from '../types/session';
import { SessionIdentityContext } from '../hooks/useSessionIdentity';

export interface SessionIdentityProviderProps {
    squadronId: string;
    operatorSn: string;
    status?: SessionStatus;
    winchId?: number | null;
    children: React.ReactNode;
}

export const SessionIdentityProvider: React.FC<SessionIdentityProviderProps> = ({
    squadronId,
    operatorSn,
    status,
    winchId,
    children,
}) => {
    const sessionStatus: SessionStatus = useMemo(
        () => status ?? (winchId !== undefined && winchId !== null
            ? { status: 'open', winchId }
            : { status: 'unselected' }),
        [status, winchId]
    );

    const derivedWinchId = 'winchId' in sessionStatus ? sessionStatus.winchId : null;

    const value = useMemo(() => ({
        squadronId,
        operatorSn,
        status: sessionStatus,
        winchId: derivedWinchId,
    }), [squadronId, operatorSn, sessionStatus, derivedWinchId]);

    return (
        <SessionIdentityContext.Provider value={value}>
            {children}
        </SessionIdentityContext.Provider>
    );
};
