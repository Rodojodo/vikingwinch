import type {LaunchPayload, LaunchResponse} from '../types';
import {request} from '../../../core/http/request';

export const postLaunchToDb = async (payload: LaunchPayload): Promise<LaunchResponse> => {
    return request<LaunchResponse>(`/launches`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export const removeLaunchFromDb = async (launchId: number): Promise<void> => {
    return request<void>(`/launches/${launchId}`, {
        method: 'DELETE',
    });
}

export const getLaunches = async (winchId: number, day: string): Promise<LaunchResponse[]> => {
    return request<LaunchResponse[]>(`/launches?winch_id=${winchId}&day=${day}`);
}
