import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postLaunchToDb, removeLaunchFromDb, getLaunches } from './launchClient';
import { apiFetch } from '../../../core/http/fetchClient';
import type { LaunchPayload, LaunchResponse } from '../types';

vi.mock('../../../core/http/fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('launchClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('postLaunchToDb sends POST request to /launches with payload', async () => {
        const payload: LaunchPayload = {
            squadron_id: '621 VGS',
            winch_id: 1,
            drum: 'left',
            operator_sn: 'OP-1234',
            cable_id: null,
            burn: false,
        };

        const mockResponse: LaunchResponse = {
            ...payload,
            id: 101,
            launch_number: 1,
            timestamp: '2026-09-16T10:00:00Z',
            day: '2026-09-16',
            created_at: '2026-09-16T10:00:00Z',
            remark: null,
        };

        vi.mocked(apiFetch).mockResolvedValue(mockResponse);

        const result = await postLaunchToDb(payload);

        expect(apiFetch).toHaveBeenCalledWith('/launches', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        expect(result).toEqual(mockResponse);
    });

    it('removeLaunchFromDb sends DELETE request to /launches/:launchId', async () => {
        vi.mocked(apiFetch).mockResolvedValue(undefined);

        await removeLaunchFromDb(42);

        expect(apiFetch).toHaveBeenCalledWith('/launches/42', {
            method: 'DELETE',
        });
    });

    it('getLaunches sends GET request with winch_id and day query params', async () => {
        const mockLaunches: LaunchResponse[] = [];
        vi.mocked(apiFetch).mockResolvedValue(mockLaunches);

        const result = await getLaunches(3, '2026-09-16');

        expect(apiFetch).toHaveBeenCalledWith('/launches?winch_id=3&day=2026-09-16');
        expect(result).toEqual(mockLaunches);
    });
});
