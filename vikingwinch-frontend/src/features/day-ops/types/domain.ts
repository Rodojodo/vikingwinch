import type {DayLogType} from './api';

export interface DayLogRecord {
    id: number;
    squadronId: string;
    winchId: number;
    operatorSn: string;
    traineeSn: string | null;
    type: DayLogType;
    cableCheck: string | null;
    hours: number | null;
    timestamp: string | null;
}
