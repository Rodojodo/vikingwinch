import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postRemarkToDb } from './remarksClient';
import { apiFetch } from '../../../core/http/fetchClient';
// eslint-disable-next-line no-restricted-imports
import type { RemarkPayload, LaunchResponse } from '../../launch-ops/types';

vi.mock('../../../core/http/fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('remarksClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('postRemarkToDb sends POST to /launches/remarks with payload', async () => {
        const payload: RemarkPayload = {
            id: 10,
            remark: 'Replaced weak link',
        };

        const mockResponse: LaunchResponse = {
            id: 10,
            launch_number: 1,
            timestamp: '2026-09-16T10:00:00Z',
            drum: 'left',
            operator_sn: 'OP-1234',
            squadron_id: '621 VGS',
            winch_id: 1,
            cable_id: null,
            created_at: '2026-09-16T10:00:00Z',
            day: '2026-09-16',
            remark: 'Replaced weak link',
        };

        vi.mocked(apiFetch).mockResolvedValue(mockResponse);

        const result = await postRemarkToDb(payload);

        expect(apiFetch).toHaveBeenCalledWith('/launches/remarks', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        expect(result).toEqual(mockResponse);
    });
});
