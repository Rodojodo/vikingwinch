import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {FinishDayPanel} from './FinishDayPanel.tsx';
import {getOperatorsForSquadron} from '../../../core/http/operatorsClient.ts';
import type {OperatorRead} from '../../../core/types';

const mockFinishDay = vi.fn();
const mockExportLog = vi.fn();

vi.mock('../../../app/hooks/useSessionIdentity.ts', () => ({
    useSessionIdentity: vi.fn(() => ({squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1'})),
}));

vi.mock('../hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({
        dayFinished: false,
        finishDay: mockFinishDay,
    })),
}));

vi.mock('../../../core/http/operatorsClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

describe('FinishDayPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFinishDay.mockReset();
        mockExportLog.mockReset();
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            {service_no: 'OP1', name: 'Operator 1', squadron_id: 'sqn1'},
        ]);
        mockFinishDay.mockResolvedValue(undefined);
        mockExportLog.mockResolvedValue(undefined);
    });

    it('renders Finish Day button and toggles panel', () => {
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        expect(screen.queryByText('Hours Stop')).not.toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /Finish Day/i }));

        expect(screen.getByText('Hours Stop')).toBeVisible();
        expect(getOperatorsForSquadron).toHaveBeenCalledWith('sqn1', expect.any(AbortSignal));
    });

    it('submits correctly when fields are valid', async () => {
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));

        await waitFor(() => {
            expect(screen.getByText('Select...')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), { target: { value: '12.5' } });

        // Select an operator (Cable Check By)
        fireEvent.mouseDown(screen.getByRole('combobox'));
        await screen.findByRole('listbox');
        fireEvent.click(screen.getByText('Operator 1'));

        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]);

        await waitFor(() => {
            expect(mockFinishDay).toHaveBeenCalledWith('OP1', 12.5);
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

    it('handles operator fetch error', async () => {
        vi.mocked(getOperatorsForSquadron).mockRejectedValueOnce(new Error('Failed to load'));
        render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);

        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));

        expect(await screen.findByText('Failed to load operators')).toBeInTheDocument();
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

    it('aborts fetch operators if unmounted before completion', async () => {
        let resolvePromise: (val: OperatorRead[]) => void = () => {};
        const promise = new Promise<OperatorRead[]>((resolve) => { resolvePromise = resolve; });
        vi.mocked(getOperatorsForSquadron).mockReturnValue(promise);

        const {unmount} = render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));

        unmount();
        resolvePromise([{ service_no: 'OP1', name: 'Operator 1', squadron_id: 'sqn1' }]);

        await new Promise(r => setTimeout(r, 0));
    });

    it('aborts fetch operators and ignores errors if unmounted before completion', async () => {
        let rejectPromise: (reason: unknown) => void = () => {};
        const promise = new Promise<OperatorRead[]>((_, reject) => { rejectPromise = reject; });
        vi.mocked(getOperatorsForSquadron).mockReturnValue(promise);

        const {unmount} = render(<FinishDayPanel isLoading={false} onExportLog={mockExportLog}/>);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));

        unmount();
        rejectPromise(new Error('Network error'));

        await new Promise(r => setTimeout(r, 0));
    });
});
