import { createContext, useContext } from 'react';

export interface DayOpsContextType {
    dayFinished: boolean;
    signedOn: boolean;
    diCompleted: boolean;
    lastOperatorSn: string | null;
    lastTraineeSn: string | null;
    finishDay: (cableCheck?: string | null, hours?: number | null) => Promise<void>;
    recordSignOn: (traineeSn: string | null) => Promise<void>;
    recordDI: (cableCheck?: string | null, hours?: number | null) => Promise<void>;
    resetDay: () => void;
}

export const DayOpsContext = createContext<DayOpsContextType | null>(null);

export const useDayOps = (): DayOpsContextType => {
    const context = useContext(DayOpsContext);
    if (!context) {
        throw new Error('useDayOps must be used within DayOpsProvider');
    }
    return context;
};
