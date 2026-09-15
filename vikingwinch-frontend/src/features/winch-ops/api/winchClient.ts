import type { WinchRead } from '../types/api';
import { apiFetch } from '../../../core/http/fetchClient';

export const getWinchesForSquadron = async (squadronId: string, signal?: AbortSignal): Promise<WinchRead[]> => {
    return apiFetch<WinchRead[]>(`/squadrons/${squadronId}/winches`, {
        signal,
    });
};

export const getWinch = async (winchId: number): Promise<WinchRead> => {
    return apiFetch<WinchRead>(`/winches/${winchId}`);
};

export const getWinchHours = async (winchId: number): Promise<{hours: number | null}> => {
    return apiFetch<{hours: number | null}>(`/winch/${winchId}/hours`);
};

export const getBroughtForward = async (winchId: number, day: string): Promise<{left: number | null, right: number | null}> => {
    return apiFetch<{left: number | null, right: number | null}>(`/launches/brought_forward?winch_id=${winchId}&day=${day}`);
};
