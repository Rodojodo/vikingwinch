import {beforeEach, describe, expect, it, vi} from 'vitest';
import {getBroughtForward, getExportData, getWinch, getWinchesForSquadron, getWinchDayData} from './winchClient';
import {apiFetch} from '../../../core/http/fetchClient';
import type {ExportDataResponse, WinchDayDataResponse, WinchRead} from '../types';

vi.mock('../../../core/http/fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('winchClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getWinchesForSquadron calls /squadrons/:squadronId/winches with signal', async () => {
        const mockWinches: WinchRead[] = [
            { id: 1, squadron_id: '621 VGS', name: 'Winch 1', status: 'serviceable' },
        ];
        vi.mocked(apiFetch).mockResolvedValue(mockWinches);

        const controller = new AbortController();
        const result = await getWinchesForSquadron('621 VGS', controller.signal);

        expect(apiFetch).toHaveBeenCalledWith('/squadrons/621 VGS/winches', {
            signal: controller.signal,
        });
        expect(result).toEqual(mockWinches);
    });

    it('getWinch calls /winches/:winchId', async () => {
        const mockWinch: WinchRead = { id: 2, squadron_id: '621 VGS', name: 'Winch 2', status: 'serviceable' };
        vi.mocked(apiFetch).mockResolvedValue(mockWinch);

        const result = await getWinch(2);

        expect(apiFetch).toHaveBeenCalledWith('/winches/2');
        expect(result).toEqual(mockWinch);
    });

    it('getBroughtForward calls /winch/:id/bf_info?day=:day', async () => {
        vi.mocked(apiFetch).mockResolvedValue({ left: 12, right: 14, hours: 145.2 });

        const result = await getBroughtForward(1, '2026-09-16');

        expect(apiFetch).toHaveBeenCalledWith('/winch/1/bf_info?day=2026-09-16');
        expect(result).toEqual({ left: 12, right: 14, hours: 145.2 });
    });

    it('getWinchDayData calls /winch/:id/day_data?day=:day with optional signal', async () => {
        const mockDayData: WinchDayDataResponse = {
            logs: [
                {
                    id: 1,
                    squadron_id: '621 VGS',
                    winch_id: 1,
                    type: 'di',
                    timestamp: '2026-09-19T08:00:00Z',
                    operator_sn: 'OP-1',
                    hours: 10,
                },
            ],
            launches: [
                {
                    launch_id: 101,
                    launch_number: 1,
                    squadron_id: '621 VGS',
                    winch_id: 1,
                    drum: 'left',
                    timestamp: '2026-09-19T09:00:00Z',
                    operator_sn: 'OP-1',
                },
            ],
        };
        vi.mocked(apiFetch).mockResolvedValue(mockDayData);

        const controller = new AbortController();
        const result = await getWinchDayData(1, '2026-09-19', controller.signal);

        expect(apiFetch).toHaveBeenCalledWith('/winch/1/day_data?day=2026-09-19', {
            signal: controller.signal,
        });
        expect(result).toEqual(mockDayData);
    });

    it('getExportData calls /winch/:id/export_data?squadron_id=:sqn&day=:day with encoded squadronId', async () => {
        const mockExportData: ExportDataResponse = {
            winch: { id: 1, registration: 'W1', squadron_id: '621 VGS' },
            logs: [],
            launches: [],
            operators: [{ service_no: 'OP-1', name: 'Operator 1', squadron_id: '621 VGS' }],
            brought_forward: { left: 10, right: 20 },
        };
        vi.mocked(apiFetch).mockResolvedValue(mockExportData);

        const controller = new AbortController();
        const result = await getExportData(1, '621 VGS', '2026-09-19', controller.signal);

        expect(apiFetch).toHaveBeenCalledWith('/winch/1/export_data?squadron_id=621%20VGS&day=2026-09-19', {
            signal: controller.signal,
        });
        expect(result).toEqual(mockExportData);
    });
});
