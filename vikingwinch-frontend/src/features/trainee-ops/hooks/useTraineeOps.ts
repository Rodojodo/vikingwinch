import { createContext, useContext } from 'react';

export interface TraineeOpsContextType {
    traineeSn: string | null;
    activeLauncherSn: string | null;
    setTrainee: (traineeSn: string | null) => void;
    setActiveLauncher: (sn: string) => void;
}

export const TraineeOpsContext = createContext<TraineeOpsContextType | null>(null);

export const useTraineeOps = (): TraineeOpsContextType => {
    const context = useContext(TraineeOpsContext);
    if (!context) {
        throw new Error('useTraineeOps must be used within TraineeOpsProvider');
    }
    return context;
};
