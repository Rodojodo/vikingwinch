import type {LaunchPayload, LaunchResponse} from '../types/launchOpsTypes';
import {API_BASE_URL, handleApiError} from '../../winch-ops/api/utils';

export const postLaunchToDb = async (payload: LaunchPayload): Promise<LaunchResponse> => {
    const response = await fetch(`${API_BASE_URL}/launches`, {
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

export const removeLaunchFromDb = async (launchId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/launches/${launchId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    await handleApiError(response);
}

export const getLaunches = async (winchId: number, day: string): Promise<LaunchResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/launches?winch_id=${winchId}&day=${day}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}

