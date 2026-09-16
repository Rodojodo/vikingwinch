import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postDayLogToDb, getDayLog } from './dayOpsClient';
import { apiFetch } from '../../../core/http/fetchClient';
import type { DayLogPayload, DayLogResponse } from '../types';

vi.mock('../../../core/http/fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('dayOpsClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('postDayLogToDb sends POST to /winch/:winchId/day_log with payload', async () => {
        const payload: DayLogPayload = {
            squadron_id: '621 VGS',
            winch_id: 5,
            operator_sn: 'OP-1234',
            trainee: 'TR-5678',
            type: 'sign_on',
            cable_check: null,
            hours: null,
        };

        const mockResponse: DayLogResponse = {
            ...payload,
            id: 1,
            timestamp: '2026-09-16T08:00:00Z',
            day: '2026-09-16',
        };

        vi.mocked(apiFetch).mockResolvedValue(mockResponse);

        const result = await postDayLogToDb(payload, 5);

        expect(apiFetch).toHaveBeenCalledWith('/winch/5/day_log', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        expect(result).toEqual(mockResponse);
    });

    it('getDayLog sends GET to /winch/:winchId/day_log?day=:day', async () => {
        const mockLogs: DayLogResponse[] = [];
        vi.mocked(apiFetch).mockResolvedValue(mockLogs);

        const result = await getDayLog(5, '2026-09-16');

        expect(apiFetch).toHaveBeenCalledWith('/winch/5/day_log?day=2026-09-16');
        expect(result).toEqual(mockLogs);
    });
});
