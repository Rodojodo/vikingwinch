import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQualifications, refreshQualifications } from './qualificationClient';
import { apiFetch } from '../../../core/http/fetchClient';
import type { OperatorQualificationsRead } from '../types';

vi.mock('../../../core/http/fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('qualificationClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockQuals: OperatorQualificationsRead = {
        service_no: 'OP-1234',
        stars_resource_id: 'RES-1',
        c005_operator: 'green',
        c005_expiry: null,
        e004_instructor: 'nil',
        e004_expiry: null,
        c003_examiner: 'nil',
        c003_expiry: null,
        rolling_currency: 'green',
        rolling_expiry: null,
        is_stale: false,
        last_checked_at: '2026-10-15T12:00:00Z',
    };

    it('getQualifications sends GET to /operators/me/qualifications', async () => {
        vi.mocked(apiFetch).mockResolvedValue(mockQuals);

        const result = await getQualifications();

        expect(apiFetch).toHaveBeenCalledWith('/operators/me/qualifications');
        expect(result).toEqual(mockQuals);
    });

    it('refreshQualifications sends POST to /operators/me/qualifications/refresh', async () => {
        vi.mocked(apiFetch).mockResolvedValue(mockQuals);

        const result = await refreshQualifications();

        expect(apiFetch).toHaveBeenCalledWith('/operators/me/qualifications/refresh', {
            method: 'POST',
        });
        expect(result).toEqual(mockQuals);
    });
});
