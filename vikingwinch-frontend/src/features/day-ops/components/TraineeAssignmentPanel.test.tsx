import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TraineeAssignmentPanel} from './TraineeAssignmentPanel.tsx';
import {getOperatorsForSquadron} from '../../winch-ops/api/dataClient.ts';

vi.mock('../../winch-ops/api/dataClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

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
