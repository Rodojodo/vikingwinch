import React, { createContext, useContext } from 'react';

export interface SessionIdentityContextType {
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
}

const SessionIdentityContext = createContext<SessionIdentityContextType | null>(null);

export const SessionIdentityProvider: React.FC<{
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    children: React.ReactNode;
}> = ({ squadronId, operatorSn, winchId, children }) => {
    return (
        <SessionIdentityContext.Provider value={{ squadronId, operatorSn, winchId }}>
            {children}
        </SessionIdentityContext.Provider>
    );
};

export const useSessionIdentity = () => {
    const context = useContext(SessionIdentityContext);
    if (!context) {
        throw new Error('useSessionIdentity must be used within SessionIdentityProvider');
    }
    return context;
};
