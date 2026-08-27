import {useReducer, useState} from 'react';

import {postLaunchToDb} from "../api/dataClient.ts";
import {initialState, winchReducer} from "../state/winchReducer.ts";


export const useWinchSession = () => {
    const [state, dispatch] = useReducer(winchReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const executeLaunch = async (drum: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Extract ONLY the fields the POST request needs from state
            const payload = {
                squadron_id: state.squadron,
                winch_id: state.winchId,
                operator_id: state.operatorSn,
                drum: drum,
            };

            // 2. Send the payload
            const responseData = await postLaunchToDb(payload);

            // Dispatch different actions to the reducer based on the button clicked
            dispatch({
                type: drum === 'left' ? 'RECORD_LEFT_LAUNCH' : 'RECORD_RIGHT_LAUNCH',
                payload: responseData
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Launch execution failed');
        } finally {
            setIsLoading(false);
        }
    };

    console.log(state)

    return {state, isLoading, error, executeLaunch};
};