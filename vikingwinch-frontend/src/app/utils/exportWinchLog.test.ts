import {beforeEach, describe, expect, it, vi} from 'vitest';
import {exportWinchLogsheet, getWinchDayStatus} from './exportWinchLog';
import {getExportData, getWinchDayData} from '../../features/winch-ops/api/winchClient';
import {exportLog} from './exportLog';
import type {ExportDataResponse, WinchDayDataResponse} from '../../features/winch-ops/types';

vi.mock('../../features/winch-ops/api/winchClient', () => ({
    getWinchDayData: vi.fn(),
    getExportData: vi.fn(),
}));

vi.mock('./exportLog', () => ({
    exportLog: vi.fn(),
}));

describe('exportWinchLog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getWinchDayStatus', () => {
        it('returns hasUnfinishedDay: true when launches exist and finish_day log is absent', async () => {
            const mockData: WinchDayDataResponse = {
                logs: [
                    {
                        id: 1,
                        squadron_id: '621 VGS',
                        winch_id: 1,
                        type: 'di',
                        timestamp: '2026-09-19T08:00:00Z',
                        operator_sn: 'OP-1',
                    },
                ],
                launches: [
                    {
                        launch_id: 10,
                        launch_number: 1,
                        squadron_id: '621 VGS',
                        winch_id: 1,
                        drum: 'left',
                        timestamp: '2026-09-19T09:00:00Z',
                        operator_sn: 'OP-1',
                    },
                ],
            };
            vi.mocked(getWinchDayData).mockResolvedValue(mockData);

            const status = await getWinchDayStatus(1, '2026-09-19');

            expect(getWinchDayData).toHaveBeenCalledWith(1, '2026-09-19', undefined);
            expect(status).toEqual({
                winchId: 1,
                launchCount: 1,
                hasFinishDay: false,
                hasUnfinishedDay: true,
            });
        });

        it('returns hasUnfinishedDay: false when launches exist but finish_day log is present', async () => {
            const mockData: WinchDayDataResponse = {
                logs: [
                    {
                        id: 1,
                        squadron_id: '621 VGS',
                        winch_id: 2,
                        type: 'finish_day',
                        timestamp: '2026-09-19T17:00:00Z',
                        operator_sn: 'OP-1',
                    },
                ],
                launches: [
                    {
                        launch_id: 20,
                        launch_number: 1,
                        squadron_id: '621 VGS',
                        winch_id: 2,
                        drum: 'left',
                        timestamp: '2026-09-19T10:00:00Z',
                        operator_sn: 'OP-1',
                    },
                ],
            };
            vi.mocked(getWinchDayData).mockResolvedValue(mockData);

            const status = await getWinchDayStatus(2, '2026-09-19');

            expect(status).toEqual({
                winchId: 2,
                launchCount: 1,
                hasFinishDay: true,
                hasUnfinishedDay: false,
            });
        });

        it('returns hasUnfinishedDay: false when 0 launches exist even without finish_day log', async () => {
            const mockData: WinchDayDataResponse = {
                logs: [],
                launches: [],
            };
            vi.mocked(getWinchDayData).mockResolvedValue(mockData);

            const status = await getWinchDayStatus(3, '2026-09-19');

            expect(status).toEqual({
                winchId: 3,
                launchCount: 0,
                hasFinishDay: false,
                hasUnfinishedDay: false,
            });
        });

        it('defaults to today date string when day parameter is omitted', async () => {
            const mockData: WinchDayDataResponse = {
                logs: [],
                launches: [],
            };
            vi.mocked(getWinchDayData).mockResolvedValue(mockData);

            await getWinchDayStatus(1);

            expect(getWinchDayData).toHaveBeenCalledWith(1, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), undefined);
        });
    });

    describe('exportWinchLogsheet', () => {
        it('fetches export data and calls exportLog', async () => {
            const mockExportData: ExportDataResponse = {
                winch: { id: 1, registration: 'W1', squadron_id: '621 VGS' },
                logs: [],
                launches: [],
                operators: [],
                brought_forward: { left: 0, right: 0 },
            };
            vi.mocked(getExportData).mockResolvedValue(mockExportData);
            vi.mocked(exportLog).mockResolvedValue();

            await exportWinchLogsheet(1, '621 VGS', '2026-09-19');

            expect(getExportData).toHaveBeenCalledWith(1, '621 VGS', '2026-09-19');
            expect(exportLog).toHaveBeenCalledWith(mockExportData, '2026-09-19');
        });

        it('throws error if winchId is 0 or falsy', async () => {
            await expect(exportWinchLogsheet(0, '621 VGS')).rejects.toThrow('No winch selected');
        });

        it('propagates error when getExportData fails', async () => {
            vi.mocked(getExportData).mockRejectedValue(new Error('Network error'));

            await expect(exportWinchLogsheet(1, '621 VGS', '2026-09-19')).rejects.toThrow('Network error');
        });

        it('propagates error when exportLog fails', async () => {
            const mockExportData: ExportDataResponse = {
                winch: { id: 1, registration: 'W1', squadron_id: '621 VGS' },
                logs: [],
                launches: [],
                operators: [],
                brought_forward: { left: 0, right: 0 },
            };
            vi.mocked(getExportData).mockResolvedValue(mockExportData);
            vi.mocked(exportLog).mockRejectedValue(new Error('Export failed'));

            await expect(exportWinchLogsheet(1, '621 VGS', '2026-09-19')).rejects.toThrow('Export failed');
        });
    });
});
