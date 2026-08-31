import {useReducer, useState, useMemo, useCallback} from 'react';
import type {DayLogPayload, DrumPosition, LaunchPayload, RemarkPayload} from '../types';
import {postLaunchToDb, postRemarkToDb, postTraineeChangeToDb, removeLaunchFromDb} from '../api/dataClient';
import { initialState, winchReducer } from '../state/winchReducer';

export const useWinchSession = () => {
    const [state, dispatch] = useReducer(winchReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const derived = useMemo(() => {
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
    }, [state.leftHistory, state.rightHistory]);

    const executeLaunch = useCallback(async (drum: DrumPosition, burn: boolean = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const payload: LaunchPayload = {
                squadron_id: state.squadron,
                winch_id: state.winchId,
                operator_id: state.operatorSn,
                drum,
                burn,
            };
            const responseData = await postLaunchToDb(payload);
            dispatch({ type: 'RECORD_LAUNCH', payload: responseData });
            return responseData;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Launch execution failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [state.squadron, state.winchId, state.operatorSn]);

    const undoLaunch = useCallback(async (drum: DrumPosition) => {
        const targetRecord = drum === 'left' ? derived.leftLastRecord : derived.rightLastRecord;
        if (!targetRecord) {
            setError(`No recorded launches to undo on ${drum} drum.`);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await removeLaunchFromDb(targetRecord.id);
            dispatch({ type: 'UNDO_LAUNCH', payload: { drum } });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Undo execution failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [derived.leftLastRecord, derived.rightLastRecord]);

    const changeTrainee = useCallback(async (traineeSn: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const payload: DayLogPayload = {
                squadron_id: state.squadron,
                winch_id: state.winchId,
                operator_id: state.operatorSn,
                trainee: traineeSn,
                type: 'sign_on',
                cable_check: null,
                hours: null,
            };
            const responseData = await postTraineeChangeToDb(payload, state.winchId);
            dispatch({ type: 'CHANGE_TRAINEE', payload: responseData });
            return responseData;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Trainee change failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [state.squadron, state.winchId, state.operatorSn]);

    const addRemark = useCallback(async (remark: string | null, drum: DrumPosition) => {
        setIsLoading(true);
        setError(null);
        try {
            const targetRecord = drum === 'left' ? derived.leftLastRecord : derived.rightLastRecord;
            if (!targetRecord) {
                throw new Error(`No launch recorded on ${drum} drum.`);
            }
            const payload: RemarkPayload = {
                launch_id: targetRecord.id,
                winch_id: state.winchId,
                remark: remark,
            };
            await postRemarkToDb(payload);

            // Explicitly define parameters instead of passing the raw API response object
            dispatch({
                type: 'ADD_REMARK',
                payload: { drum, id: targetRecord.id, remark }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Add remark failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [derived.leftLastRecord, derived.rightLastRecord, state.winchId]);

    return {
        state,
        derived,
        isLoading,
        error,
        executeLaunch,
        undoLaunch,
        changeTrainee,
        addRemark,
    };
};