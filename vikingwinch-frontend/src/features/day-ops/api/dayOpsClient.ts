import type {BroughtForwardInfoResponse, DayLogPayload, DayLogResponse} from '../types';
import {request} from '../../../core/http/request';

export const postDayLogToDb = async (payload: DayLogPayload, winchId: number): Promise<DayLogResponse> => {
    return request<DayLogResponse>(`/winch/${winchId}/day_log`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export const getDayLog = async (winchId: number, day: string): Promise<DayLogResponse[]> => {
    return request<DayLogResponse[]>(`/winch/${winchId}/day_log?day=${day}`);
}

export const getBroughtForwardInfo = async (winchId: number, day: string): Promise<BroughtForwardInfoResponse> => {
    return request<BroughtForwardInfoResponse>(`/winch/${winchId}/bf_info?day=${day}`);
}
