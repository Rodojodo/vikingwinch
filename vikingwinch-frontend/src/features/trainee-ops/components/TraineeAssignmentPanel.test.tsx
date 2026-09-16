import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TraineeAssignmentPanel} from './TraineeAssignmentPanel.tsx';
import { getOperatorsForSquadron } from "../../../core/http/operatorsClient.ts";

vi.mock('../../../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('../hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));
vi.mock('../../launch-ops/hooks/useLaunchOps.tsx', () => ({
    useLaunchOps: vi.fn(() => ({ 
        derived: { leftLastRecord: {}, rightLastRecord: {} }, 
        leftHistory: [], 
        rightHistory: [], 
        executeLaunch: vi.fn().mockResolvedValue(undefined), 
        undoLaunch: vi.fn().mockResolvedValue(undefined), 
        addRemarkToState: vi.fn() 
    }))
}));
vi.mock('../../day-ops/hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));

vi.mock("../../../core/http/operatorsClient.ts", () => ({ getOperatorsForSquadron: vi.fn() }));

const mockRecordSignOn = vi.fn().mockResolvedValue({});

describe('TraineeAssignmentPanel', () => {
    const defaultProps = {
        isLoading: false,
        recordSignOn: mockRecordSignOn,
        squadron: 'sqn1',
        operatorSn: 'OP1'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { service_no: 'OP1', name: 'Geronimo Jones', squadron_id: 'sqn1' },
            { service_no: 'OP2', name: 'Charlie Bloggs', squadron_id: 'sqn1' }
        ]);
    });

    it('renders the collapsed state by default', () => {
        render(<TraineeAssignmentPanel {...defaultProps} />);

        expect(screen.getByText('+ Add trainee')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('expands the panel when the add trainee button is clicked', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel {...defaultProps} />);

        await user.click(screen.getByText('+ Add trainee'));

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });
        
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('collapses the panel when the cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel {...defaultProps} />);

        await user.click(screen.getByText('+ Add trainee'));
        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });
        
        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(screen.getByText('+ Add trainee')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('calls recordSignOn with null when no trainee is selected', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel {...defaultProps} />);

        await user.click(screen.getByText('+ Add trainee'));

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(confirmButton).not.toBeDisabled();
        await user.click(confirmButton);
        expect(mockRecordSignOn).toHaveBeenCalledWith(null);
    });

    it('updates the selected trainee, calls recordSignOn, and collapses on confirm', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel {...defaultProps} />);

        await user.click(screen.getByText('+ Add trainee'));

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const selectButton = screen.getByRole('combobox');
        await user.click(selectButton);

        const listbox = screen.getByRole('listbox');
        const newOption = within(listbox).getByRole('option', { name: 'Charlie Bloggs' });
        await user.click(newOption);

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(confirmButton).not.toBeDisabled();
        
        await user.click(confirmButton);

        expect(mockRecordSignOn).toHaveBeenCalledTimes(1);
        expect(mockRecordSignOn).toHaveBeenCalledWith('OP2');
        
        // Should collapse after
        await waitFor(() => {
            expect(screen.getByText('+ Add trainee')).toBeInTheDocument();
            expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        });
    });
});
