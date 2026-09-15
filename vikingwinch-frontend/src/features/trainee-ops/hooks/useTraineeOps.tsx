import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { traineeReducer, initialTraineeState } from '../state/traineeReducer';
import { useSessionIdentity } from '../../../app/providers/SessionIdentityProvider';

interface TraineeOpsContextType {
    traineeSn: string | null;
    activeLauncherSn: string | null;
    setTrainee: (traineeSn: string | null) => void;
    setActiveLauncher: (sn: string) => void;
}

const TraineeOpsContext = createContext<TraineeOpsContextType | null>(null);

export const TraineeOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(traineeReducer, initialTraineeState);
    const { operatorSn } = useSessionIdentity();

    // Default active launcher to the operator when operator changes
    useEffect(() => {
        if (!state.activeLauncherSn && operatorSn) {
            dispatch({ type: 'SET_ACTIVE_LAUNCHER', payload: operatorSn });
        }
    }, [operatorSn, state.activeLauncherSn]);

    const setTrainee = useCallback((traineeSn: string | null) => {
        dispatch({ type: 'SET_TRAINEE', payload: { traineeSn, operatorSn } });
    }, [operatorSn]);

    const setActiveLauncher = useCallback((sn: string) => {
        dispatch({ type: 'SET_ACTIVE_LAUNCHER', payload: sn });
    }, []);

    return (
        <TraineeOpsContext.Provider value={{
            traineeSn: state.traineeSn,
            activeLauncherSn: state.activeLauncherSn,
            setTrainee,
            setActiveLauncher,
        }}>
            {children}
        </TraineeOpsContext.Provider>
    );
};

export const useTraineeOps = () => {
    const context = useContext(TraineeOpsContext);
    if (!context) {
        throw new Error('useTraineeOps must be used within TraineeOpsProvider');
    }
    return context;
};
