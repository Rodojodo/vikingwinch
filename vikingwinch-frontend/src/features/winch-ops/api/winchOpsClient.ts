import type {ExportDataResponse, WinchDayDataResponse, WinchHoursResponse, WinchRead} from '../types';
import {request} from '../../../core/http/request';

export const getWinchesForSquadron = async (squadronId: string, signal?: AbortSignal): Promise<WinchRead[]> => {
    const res = await request<WinchRead[]>(`/squadrons/${squadronId}/winches`, { signal });
    return res || [];
}

export const getWinch = async (winchId: number): Promise<WinchRead> => {
    return request<WinchRead>(`/winches/${winchId}`);
}

export const getWinchHours = async (winchId: number): Promise<WinchHoursResponse> => {
    return request<WinchHoursResponse>(`/winch/${winchId}/hours`);
}

export const getWinchDayData = async (winchId: number, day: string): Promise<WinchDayDataResponse> => {
    return request<WinchDayDataResponse>(`/winch/${winchId}/day_data?day=${day}`);
}

export const getExportData = async (winchId: number, squadronId: string, day: string): Promise<ExportDataResponse> => {
    return request<ExportDataResponse>(`/winch/${winchId}/export_data?squadron_id=${squadronId}&day=${day}`);
}
