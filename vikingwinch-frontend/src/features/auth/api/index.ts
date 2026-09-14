import type {OperatorRead} from '../types';
import {API_BASE_URL, handleApiError} from '../../winch-ops/api/utils';

export const getOperatorsForSquadron = async (squadronId: string, signal?: AbortSignal): Promise<OperatorRead[]> => {
    const response = await fetch(`${API_BASE_URL}/squadrons/${squadronId}/operators`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        signal,
    });

    await handleApiError(response);

    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text) as OperatorRead[];
}
