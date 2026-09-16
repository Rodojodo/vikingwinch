import type {DayOpsAction, DayOpsState} from '../types/state';

export type {DayOpsState, DayOpsAction} from '../types/state';

export const initialDayOpsState: DayOpsState = {
    dayFinished: false,
    signedOn: false,
    diCompleted: false,
    lastOperatorSn: null,
    lastTraineeSn: null,
};

export const dayReducer = (state: DayOpsState, action: DayOpsAction): DayOpsState => {
    switch (action.type) {
        case 'FINISH_DAY':
            return {...state, dayFinished: true};
        case 'RECORD_SIGN_ON':
            return {
                ...state,
                signedOn: true,
                lastOperatorSn: action.payload.operatorSn,
                lastTraineeSn: action.payload.traineeSn,
            };
        case 'RECORD_DI':
            return {...state, diCompleted: true};
        case 'RESET_DAY':
            return initialDayOpsState;
        default:
            return state;
    }
};
