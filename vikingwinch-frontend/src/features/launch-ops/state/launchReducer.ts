import type {LaunchAction, LaunchState} from '../types/state';

export type {LaunchState, LaunchAction} from '../types/state';

export const initialLaunchState: LaunchState = {
    leftHistory: [],
    rightHistory: [],
};

export const launchReducer = (state: LaunchState, action: LaunchAction): LaunchState => {
    switch (action.type) {
        case 'RECORD_LAUNCH': {
            const {drum, record} = action.payload;
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
            return {
                ...state,
                leftHistory: action.payload.left,
                rightHistory: action.payload.right,
            };
        }
        case 'ADD_REMARK': {
            const { drum, id, remark } = action.payload;
            const updateHistory = (history: typeof state.leftHistory) =>
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
