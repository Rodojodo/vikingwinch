import type {ExportDataResponse, WinchDayDataResponse, WinchHoursResponse, WinchRead} from '../types/winchOpsTypes';
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

export const getWinchHours = async (winchId: number): Promise<WinchHoursResponse> => {
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/hours`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}


export const getWinchDayData = async (winchId: number, day: string): Promise<WinchDayDataResponse> => {
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/day_data?day=${day}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}

export const getExportData = async (winchId: number, squadronId: string, day: string): Promise<ExportDataResponse> => {
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/export_data?squadron_id=${squadronId}&day=${day}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}
