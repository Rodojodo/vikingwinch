import { useReducer } from 'react';

import {postLaunchToDb} from "../api/dataClient.ts";
import {initialState, winchReducer} from "../state/winchReducer.ts";


export const useDataSync = () => {
    const [state, dispatch] = useReducer(winchReducer, initialState);

    const handleSync = async (drum: string) => {
        state.isLoading = true;

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
            if (drum === 'left') {
                dispatch({type: 'RECORD_LEFT_LAUNCH', payload: responseData});
            } else {
                dispatch({type: 'RECORD_RIGHT_LAUNCH', payload: responseData});
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.log(message);
            state.isLoading = false;
        }
    };

    // const updateField = (field: string, value: string) => {
    //     dispatch({type: 'UPDATE_FIELD', field, value});
    // };

    return {state, handleSync};
};