import type { DrumPosition } from '../../../core/types';
import type { LaunchRecord } from '../types/index.ts';
import type { LaunchResponse } from '../types/index.ts';

export interface LaunchState {
    leftHistory: LaunchRecord[];
    rightHistory: LaunchRecord[];
}

export type LaunchAction =
    | { type: 'RECORD_LAUNCH'; payload: LaunchResponse }
    | { type: 'UNDO_LAUNCH'; payload: { drum: DrumPosition } }
    | { type: 'HYDRATE_HISTORY'; payload: { sorted: LaunchResponse[] } }
    | { type: 'ADD_REMARK'; payload: { drum: DrumPosition; id: number; remark: string | null } };

export const initialLaunchState: LaunchState = {
    leftHistory: [],
    rightHistory: [],
};

export const launchReducer = (state: LaunchState, action: LaunchAction): LaunchState => {
    switch (action.type) {
        case 'RECORD_LAUNCH': {
            const { drum, timestamp, id, launch_number, remark, operator_sn } = action.payload;
            const record: LaunchRecord = { id: id, launch_number, timestamp, remark: remark, burn: launch_number === null, operator_sn };
            if (drum === 'left') {
                return { ...state, leftHistory: [...state.leftHistory, record] };
            }
            return { ...state, rightHistory: [...state.rightHistory, record] };
        }
        case 'UNDO_LAUNCH': {
            if (action.payload.drum === 'left') {
                return { ...state, leftHistory: state.leftHistory.slice(0, -1) };
            }
            return { ...state, rightHistory: state.rightHistory.slice(0, -1) };
        }
        case 'HYDRATE_HISTORY': {
            const leftHistory: LaunchRecord[] = [];
            const rightHistory: LaunchRecord[] = [];
            for (const item of action.payload.sorted) {
                const record: LaunchRecord = {
                    id: item.id,
                    launch_number: item.launch_number,
                    timestamp: item.timestamp,
                    remark: item.remark,
                    burn: item.launch_number === null,
                    operator_sn: item.operator_sn
                };
                if (item.drum === 'left') leftHistory.push(record);
                else rightHistory.push(record);
            }
            return { ...state, leftHistory, rightHistory };
        }
        case 'ADD_REMARK': {
            const { drum, id, remark } = action.payload;
            const updateHistory = (history: LaunchRecord[]) =>
                history.map(record => record.id === id ? { ...record, remark } : record);

            if (drum === 'left') {
                return { ...state, leftHistory: updateHistory(state.leftHistory) };
            }
            return { ...state, rightHistory: updateHistory(state.rightHistory) };
        }
        default:
            return state;
    }
};
