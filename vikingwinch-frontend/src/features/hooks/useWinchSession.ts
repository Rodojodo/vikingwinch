import {useReducer, useState} from 'react';
import type {DayLogPayload, DayLogType, DrumPosition, LaunchPayload} from '../types';
import {postLaunchToDb, postTraineeChangeToDb, removeLaunchFromDb} from '../api/dataClient';
import { initialState, winchReducer } from '../state/winchReducer';


export const useWinchSession = () => {
    const [state, dispatch] = useReducer(winchReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // --- Derived State Computations ---
    const leftLaunches = state.leftHistory.length;
    const rightLaunches = state.rightHistory.length;
    
    const leftLastRecord = state.leftHistory[leftLaunches - 1];
    const rightLastRecord = state.rightHistory[rightLaunches - 1];
    
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


    // --- Actions ---
    const executeLaunch = async (drum: DrumPosition, burn: boolean = false) => {
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

            if (!burn) {
                dispatch({ type: 'RECORD_LAUNCH', payload: responseData });
            }

            return responseData;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Launch execution failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const undoLaunch = async (drum: DrumPosition) => {
        const targetRecord = drum === 'left' ? leftLastRecord : rightLastRecord;

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
    }



    const changeTrainee = async (traineeSn: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const payload: DayLogPayload = {
                squadron_id: state.squadron,
                winch_id: state.winchId,
                operator_id: state.operatorSn,
                trainee: traineeSn,
                'type': 'sign_on',
                cable_check: null,
                hours: null,
            };

            const responseData = await postTraineeChangeToDb(payload, state.winchId);


            dispatch({ type: 'CHANGE_TRAINEE', payload: responseData });


            return responseData;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Launch execution failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }

    return {
        state,
        derived: {
        leftLaunches,
        rightLaunches,
        leftLast,
        rightLast,
        lastDrum,
        },
        isLoading,
        error,
        executeLaunch,
        undoLaunch,
        changeTrainee,
    };
};
