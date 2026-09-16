import type {DayLogPayload, DayLogResponse} from '../types/index.ts';
import {apiFetch} from '../../../core/http/fetchClient';

export const postDayLogToDb = async (payload: DayLogPayload, winchId: number = payload.winch_id): Promise<DayLogResponse> => {
    return apiFetch<DayLogResponse>(`/winch/${winchId}/day_log`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const getDayLog = async (winchId: number, day: string): Promise<DayLogResponse[]> => {
    return apiFetch<DayLogResponse[]>(`/winch/${winchId}/day_log?day=${day}`);
};
