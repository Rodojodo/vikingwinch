import type {WinchAction, WinchLogState} from "../types";


export const initialState: WinchLogState = {
    leftLaunches: 0,
    rightLaunches: 0,
    leftLast: null,
    rightLast: null,
    operatorSn: 'OFF-1001',
    lastDrum: null,
    squadron: '123 VGS',
    winchId: 1,
};


export const winchReducer = (state: WinchLogState, action: WinchAction): WinchLogState => {
    switch (action.type) {
        case 'RECORD_LEFT_LAUNCH':
            return {
                ...state,
                leftLaunches: state.leftLaunches + 1,
                leftLast: action.payload.timestamp,
                lastDrum: 'left',
            };
        case 'RECORD_RIGHT_LAUNCH':
            return {
                ...state,
                rightLaunches: state.rightLaunches + 1,
                rightLast: action.payload.timestamp,
                lastDrum: 'right',
            };
        default:
            return state;
    }
};