import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinishDayPanel } from './FinishDayPanel';
import { getOperatorsForSquadron } from '../api/dataClient';
import { exportLog } from '../utils/exportLog';

vi.mock('../api/dataClient', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

vi.mock('../utils/exportLog', () => ({
    exportLog: vi.fn().mockResolvedValue(undefined),
}));

describe('FinishDayPanel', () => {
    const mockFinishDay = vi.fn().mockResolvedValue(undefined);
    const mockState = { squadron: 'sqn1', winchId: 1 } as any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([{ sn: 'OP1', name: 'Operator 1' }]);
    });

    it('renders Finish Day button and toggles panel', () => {
        render(<FinishDayPanel finishDay={mockFinishDay} isLoading={false} state={mockState} />);
        
        expect(screen.queryByText('Hours Stop')).not.toBeVisible();
        
        fireEvent.click(screen.getByRole('button', { name: /Finish Day/i }));
        
        expect(screen.getByText('Hours Stop')).toBeVisible();
        expect(getOperatorsForSquadron).toHaveBeenCalledWith('sqn1');
    });

    it('submits correctly when fields are valid', async () => {
        render(<FinishDayPanel finishDay={mockFinishDay} isLoading={false} state={mockState} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        await waitFor(() => {
            expect(screen.getByText('Select...')).toBeInTheDocument();
        });
        
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), { target: { value: '12.5' } });
        
        // Select an operator (Cable Check By)
        fireEvent.mouseDown(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        fireEvent.click(screen.getByText('Operator 1'));

        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]); // The second one is inside the panel

        await waitFor(() => {
            expect(mockFinishDay).toHaveBeenCalledWith('OP1', 12.5);
            expect(screen.queryByText('Hours Stop')).not.toBeVisible();
        });
    });

    it('handles finishDay error', async () => {
        mockFinishDay.mockRejectedValueOnce(new Error('Backend error'));
        render(<FinishDayPanel finishDay={mockFinishDay} isLoading={false} state={mockState} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]);

        expect(await screen.findByText('Backend error')).toBeInTheDocument();
    });

    it('calls exportLog when Download Log is clicked', async () => {
        render(<FinishDayPanel finishDay={mockFinishDay} isLoading={false} state={mockState} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), { target: { value: '10' } });
        
        fireEvent.click(screen.getByRole('button', { name: 'Download Log' }));

        await waitFor(() => {
            expect(exportLog).toHaveBeenCalledWith(mockState, 10);
        });
    });

    it('handles operator fetch error', async () => {
        vi.mocked(getOperatorsForSquadron).mockRejectedValueOnce(new Error('Failed to load'));
        render(<FinishDayPanel finishDay={mockFinishDay} isLoading={false} state={mockState} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        expect(await screen.findByText('Failed to load operators')).toBeInTheDocument();
    });
});
