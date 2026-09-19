import type {WinchRead} from '../types';
import {apiFetch} from '../../../core/http/fetchClient';

export const getWinchesForSquadron = async (squadronId: string, signal?: AbortSignal): Promise<WinchRead[]> => {
    return apiFetch<WinchRead[]>(`/squadrons/${squadronId}/winches`, {
        signal,
    });
};

export const getWinch = async (winchId: number): Promise<WinchRead> => {
    return apiFetch<WinchRead>(`/winches/${winchId}`);
};

export const getBroughtForward = async (winchId: number, day: string): Promise<{left: number | null, right: number | null, hours: number | null}> => {
    return apiFetch<{left: number | null, right: number | null, hours: number | null}>(`/winch/${winchId}/bf_info?day=${day}`);
};
