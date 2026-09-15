import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import type { DrumPosition } from '../../../core/types';
import type { LaunchRecord, DerivedWinchState } from '../types/index.ts';
import { launchReducer, initialLaunchState } from '../state/launchReducer';
import { postLaunchToDb, removeLaunchFromDb} from '../api/launchClient';
import type { LaunchPayload, LaunchResponse } from '../types/index.ts';
import { useSessionIdentity } from '../../../app/providers/SessionIdentityProvider';
import { useTraineeOps } from '../../trainee-ops/hooks/useTraineeOps';

interface LaunchOpsContextType {
    leftHistory: LaunchRecord[];
    rightHistory: LaunchRecord[];
    derived: DerivedWinchState;
    executeLaunch: (drum: DrumPosition, burn?: boolean) => Promise<void>;
    undoLaunch: (drum: DrumPosition) => Promise<void>;
    hydrateHistory: (launches: LaunchResponse[]) => void;
    addRemarkToState: (drum: DrumPosition, id: number, remark: string | null) => void;
}

const LaunchOpsContext = createContext<LaunchOpsContextType | null>(null);

export const LaunchOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(launchReducer, initialLaunchState);
    const { winchId, operatorSn } = useSessionIdentity();
    const { traineeSn } = useTraineeOps();

    const derived = useMemo<DerivedWinchState>(() => {
        const leftTotal = state.leftHistory.length;
        const rightTotal = state.rightHistory.length;
        const leftLaunches = state.leftHistory.filter(r => !r.burn).length;
        const rightLaunches = state.rightHistory.filter(r => !r.burn).length;
        const leftLastRecord = state.leftHistory[leftTotal - 1];
        const rightLastRecord = state.rightHistory[rightTotal - 1];
        const leftLast = leftLastRecord?.timestamp ?? null;
        const rightLast = rightLastRecord?.timestamp ?? null;

        let lastDrum: DrumPosition | null = null;
        if (leftLastRecord || rightLastRecord) {
            if (!leftLastRecord) lastDrum = 'right';
            else if (!rightLastRecord) lastDrum = 'left';
            else {
                const leftTime = leftLast ? new Date(leftLast).getTime() : 0;
                const rightTime = rightLast ? new Date(rightLast).getTime() : 0;
                lastDrum = leftTime > rightTime ? 'left' : 'right';
            }
        }

        return {
            leftTotal,
            rightTotal,
            leftLaunches,
            rightLaunches,
            leftLast,
            rightLast,
            lastDrum,
            leftLastRecord,
            rightLastRecord
        };
    }, [state]);

    const executeLaunch = useCallback(async (drum: DrumPosition, burn: boolean = false) => {
        if (!winchId) throw new Error('Winch not selected');
        const payload: LaunchPayload = {
            winch_id: winchId,
            operator_sn: operatorSn,
            drum,
            burn,
            trainee: traineeSn,
        };
        const response = await postLaunchToDb(payload);
        dispatch({ type: 'RECORD_LAUNCH', payload: response });
    }, [winchId, operatorSn]);

    const undoLaunch = useCallback(async (drum: DrumPosition) => {
        const record = drum === 'left' ? derived.leftLastRecord : derived.rightLastRecord;
        if (!record) throw new Error('No launches to undo');
        
        await removeLaunchFromDb(record.id);
        dispatch({ type: 'UNDO_LAUNCH', payload: { drum } });
    }, [derived]);

    const hydrateHistory = useCallback((launches: LaunchResponse[]) => {
        dispatch({ type: 'HYDRATE_HISTORY', payload: { sorted: launches } });
    }, []);

    const addRemarkToState = useCallback((drum: DrumPosition, id: number, remark: string | null) => {
        dispatch({ type: 'ADD_REMARK', payload: { drum, id, remark } });
    }, []);

    return (
        <LaunchOpsContext.Provider value={{
            leftHistory: state.leftHistory,
            rightHistory: state.rightHistory,
            derived,
            executeLaunch,
            undoLaunch,
            hydrateHistory,
            addRemarkToState,
        }}>
            {children}
        </LaunchOpsContext.Provider>
    );
};

export const useLaunchOps = () => {
    const context = useContext(LaunchOpsContext);
    if (!context) {
        throw new Error('useLaunchOps must be used within LaunchOpsProvider');
    }
    return context;
};
