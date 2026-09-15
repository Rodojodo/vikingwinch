export interface TraineeState {
    traineeSn: string | null;
    activeLauncherSn: string | null;
}

export type TraineeAction =
    | { type: 'SET_TRAINEE'; payload: { traineeSn: string | null; operatorSn: string } }
    | { type: 'SET_ACTIVE_LAUNCHER'; payload: string };

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
                activeLauncherSn: action.payload.operatorSn
            };
        case 'SET_ACTIVE_LAUNCHER':
            return {
                ...state,
                activeLauncherSn: action.payload
            };
        default:
            return state;
    }
};
