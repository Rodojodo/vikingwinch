import React, { useCallback, useMemo, useReducer } from 'react';
import type { DrumPosition } from '../../../core/types';
import type { DerivedWinchState, LaunchPayload, LaunchRecord, LaunchResponse } from '../types';
import { initialLaunchState, launchReducer } from '../state/launchReducer';
import { postLaunchToDb, removeLaunchFromDb } from '../api/launchClient';
import { toLaunchRecord } from '../api/launchMapper';
import { useSessionIdentity } from '../../../app/hooks/useSessionIdentity';
import { LaunchOpsContext } from '../hooks/useLaunchOps';

export interface LaunchOpsProviderProps {
    children: React.ReactNode;
    traineeSn?: string | null;
}

export const LaunchOpsProvider: React.FC<LaunchOpsProviderProps> = ({
    children,
    traineeSn = null,
}) => {
    const [state, dispatch] = useReducer(launchReducer, initialLaunchState);
    const { winchId, operatorSn } = useSessionIdentity();

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
            rightLastRecord,
        };
    }, [state]);

    const executeLaunch = useCallback(async (drum: DrumPosition, burn: boolean = false, traineeSnOverride?: string | null) => {
        if (!winchId) throw new Error('Winch not selected');
        const payload: LaunchPayload = {
            winch_id: winchId,
            operator_sn: operatorSn,
            drum,
            burn,
            trainee: traineeSnOverride !== undefined ? traineeSnOverride : traineeSn,
        };
        const response = await postLaunchToDb(payload);
        const record = toLaunchRecord(response);
        dispatch({ type: 'RECORD_LAUNCH', payload: { drum, record } });
    }, [winchId, operatorSn, traineeSn]);

    const undoLaunch = useCallback(async (drum: DrumPosition) => {
        const record = drum === 'left' ? derived.leftLastRecord : derived.rightLastRecord;
        if (!record) throw new Error('No launches to undo');

        await removeLaunchFromDb(record.id);
        dispatch({ type: 'UNDO_LAUNCH', payload: { drum } });
    }, [derived]);

    const hydrateHistory = useCallback((launches: LaunchResponse[]) => {
        const left: LaunchRecord[] = [];
        const right: LaunchRecord[] = [];
        for (const item of launches) {
            const record = toLaunchRecord(item);
            if (item.drum === 'left') left.push(record);
            else right.push(record);
        }
        dispatch({ type: 'HYDRATE_HISTORY', payload: { left, right } });
    }, []);

    const addRemarkToState = useCallback((drum: DrumPosition, id: number, remark: string | null) => {
        dispatch({ type: 'ADD_REMARK', payload: { drum, id, remark } });
    }, []);

    return (
        <LaunchOpsContext.Provider
            value={{
                leftHistory: state.leftHistory,
                rightHistory: state.rightHistory,
                derived,
                executeLaunch,
                undoLaunch,
                hydrateHistory,
                addRemarkToState,
            }}
        >
            {children}
        </LaunchOpsContext.Provider>
    );
};
