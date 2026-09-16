import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOperatorsForSquadron } from './operatorsClient';
import { apiFetch } from './fetchClient';
import type { OperatorRead } from '../types';

vi.mock('./fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('operatorsClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getOperatorsForSquadron sends GET to /squadrons/:squadronId/operators with optional signal', async () => {
        const mockOperators: OperatorRead[] = [
            { service_no: 'OP-1', name: 'John Doe', squadron_id: '621 VGS' },
        ];
        vi.mocked(apiFetch).mockResolvedValue(mockOperators);

        const controller = new AbortController();
        const result = await getOperatorsForSquadron('621 VGS', controller.signal);

        expect(apiFetch).toHaveBeenCalledWith('/squadrons/621 VGS/operators', {
            method: 'GET',
            signal: controller.signal,
        });
        expect(result).toEqual(mockOperators);
    });
});
