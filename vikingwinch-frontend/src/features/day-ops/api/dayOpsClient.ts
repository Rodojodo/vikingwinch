import type {DayLogPayload, DayLogResponse} from '../types/dayOpsTypes';
import {API_BASE_URL, handleApiError} from '../../winch-ops/api/utils';

export const postDayLogToDb = async (payload: DayLogPayload, winchId: number): Promise<DayLogResponse> => {
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/day_log`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    await handleApiError(response);

    return response.json();
}

export const getDayLog = async (winchId: number, day: string): Promise<DayLogResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/day_log?day=${day}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}
