import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TraineeAssignmentPanel } from './TraineeAssignmentPanel';

const mockChangeTrainee = vi.fn();

vi.mock('../hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(() => ({
        changeTrainee: mockChangeTrainee
    }))
}));

describe('TraineeAssignmentPanel', () => {
    const defaultProps = {
        isLoading: false,
        changeTrainee: mockChangeTrainee
    };

    beforeEach(() => {
        vi.clearAllMocks();
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

        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('collapses the panel when the cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel {...defaultProps} />);

        await user.click(screen.getByText('+ Add trainee'));
        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(screen.getByText('+ Add trainee')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('disables the cancel button when isLoading is true', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel isLoading={true} changeTrainee={mockChangeTrainee} />);

        await user.click(screen.getByText('+ Add trainee'));

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
    });

    it('calls changeTrainee with the default trainee ID when confirmed', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel {...defaultProps} />);

        await user.click(screen.getByText('+ Add trainee'));
        await user.click(screen.getByRole('button', { name: /confirm/i }));

        expect(mockChangeTrainee).toHaveBeenCalledTimes(1);
        expect(mockChangeTrainee).toHaveBeenCalledWith('1');
    });

    it('updates the selected trainee and calls changeTrainee with the new ID when confirmed', async () => {
        const user = userEvent.setup();
        render(<TraineeAssignmentPanel {...defaultProps} />);

        await user.click(screen.getByText('+ Add trainee'));

        // Interact with MUI Select
        const selectButton = screen.getByRole('combobox');
        await user.click(selectButton);

        // Target the portaled listbox
        const listbox = screen.getByRole('listbox');
        const newOption = within(listbox).getByRole('option', { name: 'Gwen Tennyson' });
        await user.click(newOption);

        await user.click(screen.getByRole('button', { name: /confirm/i }));

        expect(mockChangeTrainee).toHaveBeenCalledTimes(1);
        expect(mockChangeTrainee).toHaveBeenCalledWith('2');
    });
});