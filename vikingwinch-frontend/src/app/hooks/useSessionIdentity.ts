import { createContext, useContext } from 'react';
import type { SessionStatus } from '../types/session';

export interface SessionIdentityContextType {
    squadronId: string;
    operatorSn: string;
    status: SessionStatus;
    winchId: number | null;
}

export const SessionIdentityContext = createContext<SessionIdentityContextType | null>(null);

export const useSessionIdentity = (): SessionIdentityContextType => {
    const context = useContext(SessionIdentityContext);
    if (!context) {
        throw new Error('useSessionIdentity must be used within SessionIdentityProvider');
    }
    return context;
};
