import { createContext, useContext, type ReactNode, createElement } from 'react';
import { useWinchSession } from '../../features/winch-ops/hooks/useWinchSession';

export type SessionContextType = ReturnType<typeof useWinchSession>;

export const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({
    squadronId,
    operatorSn,
    winchId,
    children
}: {
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    children: ReactNode;
}) => {
    const session = useWinchSession(squadronId, operatorSn, winchId);

    return createElement(
        SessionContext.Provider,
        { value: session },
        children
    );
};

export const useSessionStore = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionStore must be used within a SessionProvider');
    }
    return context;
};
