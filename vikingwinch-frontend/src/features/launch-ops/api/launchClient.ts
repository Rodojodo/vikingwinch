import type { LaunchCorrectionPayload, LaunchPayload, LaunchResponse } from '../types/index.ts';
import { apiFetch } from '../../../core/http/fetchClient';

export const postLaunchToDb = async (payload: LaunchPayload): Promise<LaunchResponse> => {
    return apiFetch<LaunchResponse>('/launches', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const postLaunchCorrections = async (payload: LaunchCorrectionPayload): Promise<LaunchResponse[]> => {
    return apiFetch<LaunchResponse[]>('/launches/corrections', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const removeLaunchFromDb = async (launchId: number): Promise<void> => {
    return apiFetch<void>(`/launches/${launchId}`, {
        method: 'DELETE',
    });
};

export const getLaunches = async (winchId: number, day: string): Promise<LaunchResponse[]> => {
    return apiFetch<LaunchResponse[]>(`/launches?winch_id=${winchId}&day=${day}`);
};
