import {getExportData, getWinchDayData} from '../../features/winch-ops/api/winchClient';
import {exportLog} from './exportLog';

export interface WinchDayStatus {
    winchId: number;
    launchCount: number;
    hasFinishDay: boolean;
    hasUnfinishedDay: boolean;
}

export const getTodayDateString = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getWinchDayStatus = async (
    winchId: number,
    day?: string,
    signal?: AbortSignal
): Promise<WinchDayStatus> => {
    const todayStr = day ?? getTodayDateString();
    const data = await getWinchDayData(winchId, todayStr, signal);
    const launchCount = data.launches ? data.launches.length : 0;
    const hasFinishDay = (data.logs || []).some(log => log.type === 'finish_day');
    return {
        winchId,
        launchCount,
        hasFinishDay,
        hasUnfinishedDay: launchCount > 0 && !hasFinishDay,
    };
};

export const exportWinchLogsheet = async (
    winchId: number,
    squadronId: string,
    day?: string
): Promise<void> => {
    if (!winchId) {
        throw new Error('No winch selected');
    }
    const todayStr = day ?? getTodayDateString();
    const data = await getExportData(winchId, squadronId, todayStr);
    await exportLog(data, todayStr);
};
