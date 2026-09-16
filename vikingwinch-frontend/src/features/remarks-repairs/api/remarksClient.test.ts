import {beforeEach, describe, expect, it, vi} from 'vitest';
import {postRemarkToDb} from './remarksClient';
import {apiFetch} from '../../../core/http/fetchClient';
import type {RemarkPayload, RemarkResponse} from '../types';

vi.mock('../../../core/http/fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('remarksClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('postRemarkToDb sends POST to /launches/remarks with payload', async () => {
        const payload: RemarkPayload = {
            launch_id: 10,
            winch_id: 1,
            remark: 'Replaced weak link',
        };

        const mockResponse: RemarkResponse = {
            id: 10,
            winch_id: 1,
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
