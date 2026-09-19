import type {WinchRead} from '../types';
import {apiFetch} from '../../../core/http/fetchClient.ts';
import type {ExportDataResponse, WinchDayDataResponse} from '../types/api.ts';

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

export const getWinchDayData = async (
    winchId: number,
    day: string,
    signal?: AbortSignal
): Promise<WinchDayDataResponse> => {
    return apiFetch<WinchDayDataResponse>(`/winch/${winchId}/day_data?day=${encodeURIComponent(day)}`, {
        signal,
    });
};

export const getExportData = async (
    winchId: number,
    squadronId: string,
    day: string,
    signal?: AbortSignal
): Promise<ExportDataResponse> => {
    return apiFetch<ExportDataResponse>(
        `/winch/${winchId}/export_data?squadron_id=${encodeURIComponent(squadronId)}&day=${encodeURIComponent(day)}`,
        {
            signal,
        }
    );
};
