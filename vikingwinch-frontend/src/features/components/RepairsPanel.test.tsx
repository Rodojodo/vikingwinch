import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepairsPanel } from './RepairsPanel';
import { useWinchSession } from '../hooks/useWinchSession';
import { getOperatorsForSquadron } from '../api/dataClient';

vi.mock('../hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(),
}));

vi.mock('../api/dataClient', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

describe('RepairsPanel', () => {
    const mockAddRemark = vi.fn();
    const mockOperators = [
        { sn: '123', name: 'Joe Bloggs', squadron_id: 'sqn1' },
        { sn: '456', name: 'Admin', squadron_id: 'sqn1' }
    ];

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
            state: {
                squadron: 'sqn1'
            }
        } as any);

        vi.mocked(getOperatorsForSquadron).mockResolvedValue(mockOperators);
    });

    it('renders RepairsPanel correctly', async () => {
        render(<RepairsPanel />);
        expect(screen.getByText('Repair details')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Describe the repair carried out...')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(getOperatorsForSquadron).toHaveBeenCalledWith('sqn1');
        });
    });

    it('submits repair as remark when button is clicked with worker and supervisor', async () => {
        render(<RepairsPanel />);
        
        // Wait for operators to load
        await waitFor(() => {
            expect(getOperatorsForSquadron).toHaveBeenCalled();
        });

        fireEvent.change(screen.getByPlaceholderText('Describe the repair carried out...'), {
            target: { value: 'weak link' },
        });

        const comboboxes = screen.getAllByRole('combobox');

        // Select driver
        fireEvent.mouseDown(comboboxes[0]);
        let listbox = within(await screen.findByRole('presentation')).getByRole('listbox');
        fireEvent.click(within(listbox).getByText('Joe Bloggs'));

        // Select supervisor
        fireEvent.mouseDown(comboboxes[1]);
        listbox = within(await screen.findByRole('presentation')).getByRole('listbox');
        fireEvent.click(within(listbox).getByText('Admin'));

        const submitButton = screen.getByRole('button', { name: /Sign as Supervisor/i });
        expect(submitButton).not.toBeDisabled();
        fireEvent.click(submitButton);

        expect(mockAddRemark).toHaveBeenCalledWith('Repair: weak link | Worker: 123 | Sup: 456', 'left');
    });

    it('submits repair as remark without supervisor', async () => {
        render(<RepairsPanel />);
        
        await waitFor(() => {
            expect(getOperatorsForSquadron).toHaveBeenCalled();
        });

        fireEvent.change(screen.getByPlaceholderText('Describe the repair carried out...'), {
            target: { value: 'cable fix' },
        });

        const comboboxes = screen.getAllByRole('combobox');

        // Select driver
        fireEvent.mouseDown(comboboxes[0]);
        const listbox = within(await screen.findByRole('presentation')).getByRole('listbox');
        fireEvent.click(within(listbox).getByText('Joe Bloggs'));

        const submitButton = screen.getByRole('button', { name: /Sign as Supervisor/i });
        expect(submitButton).not.toBeDisabled();
        fireEvent.click(submitButton);

        expect(mockAddRemark).toHaveBeenCalledWith('Repair: cable fix | Worker: 123', 'left');
    });

    it('shows error alert when error is present', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockAddRemark,
            isLoading: false,
            error: 'Test Error',
            derived: { leftLaunches: 1, rightLaunches: 1 },
            state: { squadron: 'sqn1' }
        } as any);

        render(<RepairsPanel />);
        expect(screen.getByText('Test Error')).toBeInTheDocument();
    });

    it('shows fetch error alert when getOperators fails', async () => {
        vi.mocked(getOperatorsForSquadron).mockRejectedValue(new Error('API fail'));

        render(<RepairsPanel />);
        
        await waitFor(() => {
            expect(screen.getByText('Failed to load operators')).toBeInTheDocument();
        });
    });

    it('disables submit button and shows text when no launches', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockAddRemark,
            isLoading: false,
            error: null,
            derived: { leftLaunches: 0, rightLaunches: 0 },
            state: { squadron: 'sqn1' }
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
