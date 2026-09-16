import type {TraineeAction, TraineeState} from '../types/state';

export type {TraineeState, TraineeAction} from '../types/state';

export const initialTraineeState: TraineeState = {
    traineeSn: null,
    activeLauncherSn: null,
};

export const traineeReducer = (state: TraineeState, action: TraineeAction): TraineeState => {
    switch (action.type) {
        case 'SET_TRAINEE':
            return {
                ...state,
                traineeSn: action.payload.traineeSn,
                activeLauncherSn: action.payload.operatorSn,
            };
        case 'SET_ACTIVE_LAUNCHER':
            return {
                ...state,
                activeLauncherSn: action.payload,
            };
        default:
            return state;
    }
};
