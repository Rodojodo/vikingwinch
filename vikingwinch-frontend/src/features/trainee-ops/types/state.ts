export interface TraineeState {
    traineeSn: string | null;
    activeLauncherSn: string | null;
}

export type TraineeAction =
    | { type: 'SET_TRAINEE'; payload: { traineeSn: string | null; operatorSn: string } }
    | { type: 'SET_ACTIVE_LAUNCHER'; payload: string };
