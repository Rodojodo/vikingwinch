import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {resetTestvgs} from '../api/resetClient';
import {DevResetDayControl} from './DevResetDayControl';

vi.mock('../api/resetClient', () => ({
    resetTestvgs: vi.fn(),
}));

describe('DevResetDayControl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_ENVIRONMENT', 'preview');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('is hidden outside development environments', () => {
        vi.stubEnv('VITE_ENVIRONMENT', 'production');

        render(<DevResetDayControl/>);

        expect(screen.queryByRole('button', {name: 'DEV ONLY RESET DAY'})).not.toBeInTheDocument();
    });

    it('confirms and reports a successful reset', async () => {
        vi.mocked(resetTestvgs).mockResolvedValue({
            squadron_id: 'testvgs',
            winches_reset: 2,
            finish_day: '2026-10-05',
            launches_created: 4,
        });
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<DevResetDayControl/>);
        fireEvent.click(screen.getByRole('button', {name: 'DEV ONLY RESET DAY'}));

        await waitFor(() => expect(resetTestvgs).toHaveBeenCalledOnce());
        expect(confirm).toHaveBeenCalled();
        expect(await screen.findByText(/Reset 2 winches/)).toBeInTheDocument();
        confirm.mockRestore();
    });
});
