import React, { useCallback, useEffect, useReducer } from 'react';
import { initialTraineeState, traineeReducer } from '../state/traineeReducer';
import { useSessionIdentity } from '../../../app/hooks/useSessionIdentity';
import { TraineeOpsContext } from '../hooks/useTraineeOps';

export interface TraineeOpsProviderProps {
    children: React.ReactNode;
}

export const TraineeOpsProvider: React.FC<TraineeOpsProviderProps> = ({ children }) => {
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
        <TraineeOpsContext.Provider
            value={{
                traineeSn: state.traineeSn,
                activeLauncherSn: state.activeLauncherSn,
                setTrainee,
                setActiveLauncher,
            }}
        >
            {children}
        </TraineeOpsContext.Provider>
    );
};
