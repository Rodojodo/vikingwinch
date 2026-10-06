import {describe, expect, it, vi} from 'vitest';
import {apiFetch} from '../../../core/http/fetchClient';
import {resetTestvgs} from './resetClient';

vi.mock('../../../core/http/fetchClient', () => ({
    apiFetch: vi.fn(),
}));

describe('resetTestvgs', () => {
    it('posts to the development reset endpoint', async () => {
        vi.mocked(apiFetch).mockResolvedValue({
            squadron_id: 'testvgs',
            winches_reset: 2,
            finish_day: '2026-10-05',
            launches_created: 4,
        });

        await expect(resetTestvgs()).resolves.toEqual({
            squadron_id: 'testvgs',
            winches_reset: 2,
            finish_day: '2026-10-05',
            launches_created: 4,
        });
        expect(apiFetch).toHaveBeenCalledWith('/dev/reset-testvgs', {method: 'POST'});
    });
});
