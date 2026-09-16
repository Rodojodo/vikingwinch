export interface DayOpsState {
    dayFinished: boolean;
    signedOn: boolean;
    diCompleted: boolean;
    lastOperatorSn: string | null;
    lastTraineeSn: string | null;
}

export type DayOpsAction =
    | { type: 'FINISH_DAY' }
    | { type: 'RECORD_SIGN_ON'; payload: { operatorSn: string; traineeSn: string | null } }
    | { type: 'RECORD_DI' }
    | { type: 'RESET_DAY' };
