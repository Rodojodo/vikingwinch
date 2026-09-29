import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type React from 'react';
import {FinishDayPanel} from './FinishDayPanel.tsx';

const mockFinishDay = vi.fn();

vi.mock('../../../app/hooks/useSessionIdentity.ts', () => ({
    useSessionIdentity: vi.fn(() => ({winchId: 42})),
}));

vi.mock('../hooks/useDayOps', () => ({
    useDayOps: vi.fn(() => ({finishDay: mockFinishDay})),
}));

describe('FinishDayPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFinishDay.mockResolvedValue(undefined);
    });

    const renderPanel = (props: Partial<React.ComponentProps<typeof FinishDayPanel>> = {}) =>
        render(<FinishDayPanel isLoading={false} diHours={120} onFinished={vi.fn()} {...props}/>);

    it('opens with Finish Day disabled and no download action', () => {
        renderPanel();
        fireEvent.click(screen.getByRole('button', {name: 'Finish Day'}));
        expect(screen.getAllByRole('button', {name: 'Finish Day'})[1]).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Download Log'})).not.toBeInTheDocument();
    });

    it('shows validation while hours are not greater than DI hours', () => {
        renderPanel();
        fireEvent.click(screen.getByRole('button', {name: 'Finish Day'}));
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), {target: {value: '120'}});
        expect(screen.getByText('Must be greater than DI hours 120')).toBeInTheDocument();
        expect(screen.getAllByRole('button', {name: 'Finish Day'})[1]).toBeDisabled();
    });

    it('submits valid finish-day hours and notifies the parent', async () => {
        const onFinished = vi.fn();
        renderPanel({onFinished});
        fireEvent.click(screen.getByRole('button', {name: 'Finish Day'}));
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), {target: {value: '126.2'}});
        fireEvent.click(screen.getAllByRole('button', {name: 'Finish Day'})[1]);
        await waitFor(() => {
            expect(mockFinishDay).toHaveBeenCalledWith(126.2);
            expect(onFinished).toHaveBeenCalledWith(126.2);
        });
    });

    it('enables submission when finish hours are greater than decimal DI hours', () => {
        renderPanel({diHours: 126.2});
        fireEvent.click(screen.getByRole('button', {name: 'Finish Day'}));
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), {target: {value: '127'}});

        expect(screen.queryByText('Must be greater than DI hours 126.2')).not.toBeInTheDocument();
        expect(screen.getAllByRole('button', {name: 'Finish Day'})[1]).toBeEnabled();
    });

    it('handles finishDay errors', async () => {
        mockFinishDay.mockRejectedValueOnce(new Error('Backend error'));
        renderPanel();
        fireEvent.click(screen.getByRole('button', {name: 'Finish Day'}));
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), {target: {value: '126.2'}});
        fireEvent.click(screen.getAllByRole('button', {name: 'Finish Day'})[1]);
        expect(await screen.findByText('Backend error')).toBeInTheDocument();
    });

    it('shows submitting state', () => {
        renderPanel({isLoading: true});
        fireEvent.click(screen.getByRole('button', {name: 'Finish Day'}));
        expect(screen.getByRole('button', {name: 'Submitting...'})).toBeInTheDocument();
    });
});
