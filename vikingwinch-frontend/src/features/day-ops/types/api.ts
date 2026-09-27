export type DayLogType = 'sign_on' | 'di' | 'finish_day' | 'cable_check';

export interface DayLogPayload {
    squadron_id: string;
    winch_id: number;
    operator_sn: string;
    trainee: string | null;
    type: DayLogType;
    hours: number | null;
    /** Accepted for legacy fixtures; the backend no longer persists this field. */
    cable_check?: string | null;
}

export interface DayLogResponse extends DayLogPayload {
    id: number;
    winch_id: number;
    timestamp: string | null;
    day?: string;
}
