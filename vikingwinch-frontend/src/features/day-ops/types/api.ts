export type DayLogType = 'sign_on' | 'di' | 'finish_day' | 'change_trainee';

export interface DayLogPayload {
    squadron_id: string;
    winch_id: number;
    operator_sn: string;
    trainee: string | null;
    type: DayLogType;
    cable_check: string | null;
    hours: number | null;
}

export interface DayLogResponse extends DayLogPayload {
    id: number;
    timestamp: string | null;
    day?: string;
}
