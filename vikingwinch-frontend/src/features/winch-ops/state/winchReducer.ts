import type { WinchAction, WinchLogState, LaunchRecord } from '../types';

export const initialState: WinchLogState = {
    squadron: '123 VGS',
    winchId: null,
    operatorSn: 'OFF-1001',
    traineeSn: null,
    leftHistory: [],
    rightHistory: [],
    dayFinished: false,
};


export const winchReducer = (state: WinchLogState, action: WinchAction): WinchLogState => {
    switch (action.type) {
        case 'RECORD_LAUNCH': {
            const {drum, timestamp, id, launch_number, burn} = action.payload;
            const record: LaunchRecord = {id, launch_number, timestamp, remark: null, burn};

            if (drum === 'left') {
                return {...state, leftHistory: [...state.leftHistory, record]};
            }
            return {...state, rightHistory: [...state.rightHistory, record]};
        }

        case 'UNDO_LAUNCH': {
            if (action.payload.drum === 'left') {
                return {...state, leftHistory: state.leftHistory.slice(0, -1)};
            }
            return {...state, rightHistory: state.rightHistory.slice(0, -1)};
        }

        case 'CHANGE_TRAINEE': {
            return {...state, traineeSn: action.payload.trainee };
        }

        case 'ADD_REMARK': {
            const { drum, id, remark } = action.payload;
            const updateHistory = (history: LaunchRecord[]) =>
                history.map(record => {
                    if (record.id === id) {
                        const newRemark = record.remark ? `${record.remark} | ${remark}` : remark;
                        return { ...record, remark: newRemark };
                    }
                    return record;
                });

            if (drum === 'left') {
                return { ...state, leftHistory: updateHistory(state.leftHistory) };
            }
            return { ...state, rightHistory: updateHistory(state.rightHistory) };
        }

        case 'FINISH_DAY': {
            return {...state, dayFinished: true };
        }
        case 'SET_WINCH_ID': {
            return {...state, winchId: action.payload};
        }
        default:
            return state;
    }
};
