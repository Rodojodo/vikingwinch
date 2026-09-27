import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {FinishDayPanel} from './FinishDayPanel.tsx';

const mockFinishDay = vi.fn();
const mockExportLog = vi.fn();

vi.mock('../../../app/hooks/useSessionIdentity.ts', () => ({
    useSessionIdentity: vi.fn(() => ({squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1'})),
}));

vi.mock('../hooks/useDayOps', () => ({
    useDayOps: vi.fn(() => ({
        dayFinished: false,
        finishDay: mockFinishDay,
    })),
}));

describe('FinishDayPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFinishDay.mockReset();
        mockExportLog.mockReset();
        mockFinishDay.mockResolvedValue(undefined);
        mockExportLog.mockResolvedValue(undefined);
    });

    it('renders Finish Day button and toggles panel', () => {
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        expect(screen.queryByText('Hours Stop')).not.toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /Finish Day/i }));

        expect(screen.getByText('Hours Stop')).toBeVisible();
    });

    it('submits correctly when fields are valid', async () => {
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));

        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), { target: { value: '12.5' } });

        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]);

        await waitFor(() => {
            expect(mockFinishDay).toHaveBeenCalledWith(12.5);
            expect(screen.queryByText('Hours Stop')).not.toBeVisible();
        });
    });

    it('handles finishDay error', async () => {
        mockFinishDay.mockRejectedValueOnce(new Error('Backend error'));
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));

        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]);

        expect(await screen.findByText('Backend error')).toBeInTheDocument();
    });

    it('calls exportLog when Download Log is clicked', async () => {
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download Log' }));

        await waitFor(() => {
            expect(mockExportLog).toHaveBeenCalled();
        });
    });

    it('handles exportLog error', async () => {
        mockExportLog.mockRejectedValueOnce(new Error('Export failed'));
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download Log' }));

        expect(await screen.findByText('Export failed')).toBeInTheDocument();
    });

    it('handles finishDay error with non-Error object', async () => {
        mockFinishDay.mockRejectedValueOnce('String error');
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]);

        expect(await screen.findByText('Failed to submit finish day')).toBeInTheDocument();
    });

    it('handles exportLog error with non-Error object', async () => {
        mockExportLog.mockRejectedValueOnce({msg: 'Export failed'});
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download Log' }));

        expect(await screen.findByText('Failed to download log')).toBeInTheDocument();
    });

    it('shows Submitting... when isLoading is true', () => {
        render(<FinishDayPanel isLoading={true} onExportLog={mockExportLog}/>);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    });

});
