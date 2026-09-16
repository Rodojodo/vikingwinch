import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignOnPanel } from './SignOnPanel.tsx';
import { getOperatorsForSquadron } from '../../../core/http/operatorsClient.ts';
import { postDayLogToDb } from '../api/dayOpsClient.ts';

const mockSetTrainee = vi.fn();

vi.mock('../../../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('../../trainee-ops/hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({
        traineeSn: null,
        activeLauncherSn: 'OP1',
        setTrainee: mockSetTrainee,
        setActiveLauncher: vi.fn(),
    }))
}));

vi.mock('../../../core/http/operatorsClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

vi.mock('../api/dayOpsClient.ts', () => ({
    postDayLogToDb: vi.fn(),
}));

describe('SignOnPanel', () => {
    const mockOnComplete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { service_no: 'OP1', name: 'Geronimo Jones', squadron_id: 'sqn1' },
            { service_no: 'OP2', name: 'Charlie Bloggs', squadron_id: 'sqn1' }
        ]);
        vi.mocked(postDayLogToDb).mockResolvedValue({
            id: 1,
            squadron_id: 'sqn1',
            winch_id: 42,
            operator_sn: 'OP1',
            trainee: null,
            type: 'sign_on',
            cable_check: null,
            hours: null,
            timestamp: '2026-09-16T08:00:00Z',
            day: '2026-09-16',
        });
    });

    it('renders winch ID, operators, and already inspected message', async () => {
        render(<SignOnPanel lastOperatorSn="OP1" lastTraineeSn="OP2" onComplete={mockOnComplete} />);

        await waitFor(() => {
            expect(screen.queryByText('— None —')).toBeInTheDocument();
        });

        expect(screen.getByText('Winch 42')).toBeInTheDocument();
        expect(screen.getByText('Current operator: Geronimo Jones & Charlie Bloggs')).toBeInTheDocument();
        expect(screen.getByText('This winch has already been inspected today.')).toBeInTheDocument();
    });

    it('allows selecting a trainee but it does not change the current operator text', async () => {
        const user = userEvent.setup();
        render(<SignOnPanel lastOperatorSn="OP1" lastTraineeSn={null} onComplete={mockOnComplete} />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.click(select);

        const listbox = screen.getByRole('listbox');
        const traineeOption = within(listbox).getByRole('option', { name: 'Charlie Bloggs' });
        await user.click(traineeOption);

        // Text shouldn't change to include Charlie Bloggs since it's the PREVIOUS operator shown
        expect(screen.getByText('Current operator: Geronimo Jones')).toBeInTheDocument();
    });

    it('submits sign on and calls onComplete when clicking Walkaround complete', async () => {
        const user = userEvent.setup();
        render(<SignOnPanel lastOperatorSn="OP1" lastTraineeSn={null} onComplete={mockOnComplete} />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('combobox'));
        await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Charlie Bloggs' }));

        const btn = screen.getByRole('button', { name: /Walkaround complete/i });
        await user.click(btn);

        expect(postDayLogToDb).toHaveBeenCalledWith({
            squadron_id: 'sqn1',
            winch_id: 42,
            operator_sn: 'OP1',
            trainee: 'OP2',
            type: 'sign_on',
            cable_check: null,
            hours: null,
        }, 42);
        expect(mockSetTrainee).toHaveBeenCalledWith('OP2');
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('handles sign on failure gracefully without calling onComplete', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(postDayLogToDb).mockRejectedValueOnce(new Error('Network error'));
        
        const user = userEvent.setup();
        render(<SignOnPanel lastOperatorSn="OP1" lastTraineeSn={null} onComplete={mockOnComplete} />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const btn = screen.getByRole('button', { name: /Walkaround complete/i });
        await user.click(btn);

        expect(postDayLogToDb).toHaveBeenCalledWith({
            squadron_id: 'sqn1',
            winch_id: 42,
            operator_sn: 'OP1',
            trainee: null,
            type: 'sign_on',
            cable_check: null,
            hours: null,
        }, 42);
        expect(mockOnComplete).not.toHaveBeenCalled();
        expect(screen.getByText('Failed to record sign-on.')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith('Sign on failed', expect.any(Error));
        
        consoleSpy.mockRestore();
    });

    it('disables the submit button while sign-on is in flight', async () => {
        let resolvePromise!: (val: any) => void;
        vi.mocked(postDayLogToDb).mockReturnValueOnce(new Promise((resolve) => {
            resolvePromise = resolve;
        }));

        const user = userEvent.setup();
        render(<SignOnPanel lastOperatorSn="OP1" lastTraineeSn={null} onComplete={mockOnComplete} />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const btn = screen.getByRole('button', { name: /Walkaround complete/i });
        expect(btn).not.toBeDisabled();

        await user.click(btn);

        expect(btn).toBeDisabled();

        resolvePromise({ id: 1 });
        await waitFor(() => {
            expect(mockOnComplete).toHaveBeenCalled();
        });
    });

    it('handles fetch operators rejection', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(getOperatorsForSquadron).mockRejectedValueOnce(new Error('Fetch failed'));

        render(<SignOnPanel lastOperatorSn="OP1" lastTraineeSn={null} onComplete={mockOnComplete} />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        consoleSpy.mockRestore();
    });
});
