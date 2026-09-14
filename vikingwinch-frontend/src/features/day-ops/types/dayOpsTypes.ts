export type DayLogType = 'finish_day' | 'di' | 'sign_on';

export interface DayLogPayload {
    squadron_id: string;
    winch_id: number;
    operator_sn: string;
    trainee: string | null;
    type: DayLogType;
    cable_check: string | null;
    hours: number | null;
}

export interface DayLogResponse {
    id: number;
    squadron_id: string;
    winch_id: number;
    operator_sn: string;
    trainee: string | null;
    type: DayLogType;
    cable_check: string | null;
    hours: number | null;
    timestamp: string | null;
}
