import type {WinchRead} from '../types';
import {API_BASE_URL, handleApiError} from './utils';

export const getWinchesForSquadron = async (squadronId: string, signal?: AbortSignal): Promise<WinchRead[]> => {
    const response = await fetch(`${API_BASE_URL}/squadrons/${squadronId}/winches`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        signal,
    });

    await handleApiError(response);

    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text) as WinchRead[];
}

export const getWinch = async (winchId: number): Promise<WinchRead> => {
    const response = await fetch(`${API_BASE_URL}/winches/${winchId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}

export const getWinchHours = async (winchId: number): Promise<{ hours: number | null }> => {
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/hours`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}
