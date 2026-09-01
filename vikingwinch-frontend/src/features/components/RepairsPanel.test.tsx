import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
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
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        expect(screen.getByText('Repair details')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Describe the repair carried out...')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(getOperatorsForSquadron).toHaveBeenCalledWith('sqn1', expect.any(AbortSignal));
        });
    });

    it('submits repair as remark when button is clicked with worker and supervisor', async () => {
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
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
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(mockAddRemark).toHaveBeenCalledWith('Repair: weak link | Worker: 123 | Sup: 456', 'left');
    });

    it('submits repair as remark without supervisor', async () => {
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
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

        const submitButton = screen.getByRole('button', { name: /Sign off Repair/i });
        expect(submitButton).not.toBeDisabled();
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(mockAddRemark).toHaveBeenCalledWith('Repair: cable fix | Worker: 123', 'left');
    });

    it('shows error alert when submission fails', async () => {
        const mockErrorAdd = vi.fn().mockRejectedValue(new Error('Test local Error'));
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockErrorAdd,
            isLoading: false,
            derived: { leftLastRecord: {}, rightLastRecord: {} },
            state: { squadron: 'sqn1' }
        } as any);

        render(<RepairsPanel addRemark={mockErrorAdd} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
        await waitFor(() => {
            expect(getOperatorsForSquadron).toHaveBeenCalled();
        });

        fireEvent.change(screen.getByPlaceholderText('Describe the repair carried out...'), {
            target: { value: 'test' },
        });

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[0]);
        const listbox = within(await screen.findByRole('presentation')).getByRole('listbox');
        fireEvent.click(within(listbox).getByText('Joe Bloggs'));

        const submitButton = screen.getByRole('button', { name: /Sign off Repair/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Test local Error')).toBeInTheDocument();
        });
    });

    it('shows fetch error alert when getOperators fails', async () => {
        vi.mocked(getOperatorsForSquadron).mockRejectedValue(new Error('API fail'));

        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
        await waitFor(() => {
            expect(screen.getByText('Failed to load operators')).toBeInTheDocument();
        });
    });

    it('disables submit button and shows text when no launches', async () => {
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockAddRemark,
            isLoading: false,
            error: null,
            derived: { leftLastRecord: null, rightLastRecord: null },
            state: { squadron: 'sqn1' }
        } as any);

        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: null, rightLastRecord: null } as any} state={{ squadron: 'sqn1' } as any} />);
        
        await waitFor(() => {
            expect(getOperatorsForSquadron).toHaveBeenCalled();
        });

        expect(screen.getByText('No launches yet')).toBeInTheDocument();
        const submitButton = screen.getByRole('button', { name: /Sign off Repair/i });
        expect(submitButton).toBeDisabled();
    });

    it('does not submit if repair details are empty', async () => {
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
        await waitFor(() => {
            expect(getOperatorsForSquadron).toHaveBeenCalled();
        });

        const submitButton = screen.getByRole('button', { name: /Sign off Repair/i });
        expect(submitButton).toBeDisabled();
    });
});
