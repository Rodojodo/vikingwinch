import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepairsPanel } from './RepairsPanel';
import { useWinchSession } from '../hooks/useWinchSession';

vi.mock('../hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(),
}));

describe('RepairsPanel', () => {
    const mockAddRemark = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockAddRemark,
            isLoading: false,
            error: null,
            derived: {
                leftLaunches: 1,
                rightLaunches: 1,
            },
        } as any);
    });

    it('renders RepairsPanel correctly', () => {
        render(<RepairsPanel />);
        expect(screen.getByText('Repair details')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Describe the repair carried out...')).toBeInTheDocument();
    });

    it('submits repair as remark when button is clicked', async () => {
        render(<RepairsPanel />);
        
        fireEvent.change(screen.getByPlaceholderText('Describe the repair carried out...'), {
            target: { value: 'weak link' },
        });

        // The Select component in MUI might render differently, let's find the combobox by some parent or role.
        // There are two comboboxes, first is driver, second is supervisor.
        // Wait, the select has displayEmpty and starts with 'Select supervisor...'. Wait, no, we can find it by that text maybe?
        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[1]);
        const listbox = within(await screen.findByRole('presentation')).getByRole('listbox');
        fireEvent.click(within(listbox).getByText('Admin'));

        const submitButton = screen.getByRole('button', { name: /Sign as Supervisor/i });
        expect(submitButton).not.toBeDisabled();
        fireEvent.click(submitButton);

        expect(mockAddRemark).toHaveBeenCalledWith('Repair: weak link', 'left');
    });

    it('shows error alert when error is present', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockAddRemark,
            isLoading: false,
            error: 'Test Error',
            derived: { leftLaunches: 1, rightLaunches: 1 },
        } as any);

        render(<RepairsPanel />);
        expect(screen.getByText('Test Error')).toBeInTheDocument();
    });

    it('disables submit button and shows text when no launches', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockAddRemark,
            isLoading: false,
            error: null,
            derived: { leftLaunches: 0, rightLaunches: 0 },
        } as any);

        render(<RepairsPanel />);
        expect(screen.getByText('No launches yet')).toBeInTheDocument();
        const submitButton = screen.getByRole('button', { name: /Sign as Supervisor/i });
        expect(submitButton).toBeDisabled();
    });

    it('does not submit if repair details are empty', () => {
        render(<RepairsPanel />);
        const submitButton = screen.getByRole('button', { name: /Sign as Supervisor/i });
        expect(submitButton).toBeDisabled();
    });
});
