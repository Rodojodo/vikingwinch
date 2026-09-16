import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWinchesForSquadron, getWinch, getWinchHours, getBroughtForward } from './winchClient';
import { apiFetch } from '../../../core/http/fetchClient';
import type { WinchRead } from '../types/api';

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

    it('getWinchHours calls /winch/:winchId/hours', async () => {
        vi.mocked(apiFetch).mockResolvedValue({ hours: 145.2 });

        const result = await getWinchHours(1);

        expect(apiFetch).toHaveBeenCalledWith('/winch/1/hours');
        expect(result).toEqual({ hours: 145.2 });
    });

    it('getBroughtForward calls /winch/:id/bf_info?day=:day', async () => {
        vi.mocked(apiFetch).mockResolvedValue({ left: 12, right: 14, hours: 145.2 });

        const result = await getBroughtForward(1, '2026-09-16');

        expect(apiFetch).toHaveBeenCalledWith('/winch/1/bf_info?day=2026-09-16');
        expect(result).toEqual({ left: 12, right: 14, hours: 145.2 });
    });
});
