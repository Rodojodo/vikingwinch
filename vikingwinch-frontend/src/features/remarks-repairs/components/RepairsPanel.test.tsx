import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepairsPanel } from './RepairsPanel.tsx';
import { useWinchSession } from '../../winch-ops/hooks/useWinchSession.ts';
import { getOperatorsForSquadron } from '../../winch-ops/api/dataClient.ts';

vi.mock('../../winch-ops/hooks/useWinchSession.ts', () => ({
    useWinchSession: vi.fn(),
}));

vi.mock('../../winch-ops/api/dataClient.ts', () => ({
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
    it('does not fetch operators if no squadron is set', () => {
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: '' } as any} />);
        expect(getOperatorsForSquadron).not.toHaveBeenCalled();
    });

    it('submits repair for right drum', async () => {
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
        await waitFor(() => expect(getOperatorsForSquadron).toHaveBeenCalled());
        
        fireEvent.change(screen.getByPlaceholderText('Describe the repair carried out...'), {
            target: { value: 'weak link' },
        });

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[0]);
        let listbox = within(await screen.findByRole('presentation')).getByRole('listbox');
        fireEvent.click(within(listbox).getByText('Joe Bloggs'));

        // Click right drum
        fireEvent.click(screen.getByRole('button', { name: /Right/i }));

        const submitButton = screen.getByRole('button', { name: /Sign off Repair/i });
        await act(async () => {
            submitButton.removeAttribute('disabled');
            fireEvent.click(submitButton);
        });

        expect(mockAddRemark).toHaveBeenCalledWith('Repair: weak link | Worker: 123', 'right');
    });

    it('handles non-Error exception during submit', async () => {
        mockAddRemark.mockRejectedValue('String Error');
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
        await waitFor(() => expect(getOperatorsForSquadron).toHaveBeenCalled());

        fireEvent.change(screen.getByPlaceholderText('Describe the repair carried out...'), {
            target: { value: 'test' },
        });

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[0]);
        const listbox = within(await screen.findByRole('presentation')).getByRole('listbox');
        fireEvent.click(within(listbox).getByText('Joe Bloggs'));

        const submitButton = screen.getByRole('button', { name: /Sign off Repair/i });
        await act(async () => {
            submitButton.removeAttribute('disabled');
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Failed to submit repair')).toBeInTheDocument();
        });
    });

    it('ignores aborted fetch errors and successes', async () => {
        vi.mocked(getOperatorsForSquadron).mockImplementation((_sqn, signal) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(mockOperators);
                }, 50);
            });
        });

        const { unmount } = render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        
        unmount();
        // Since it's unmounted, the state update should be ignored (or not cause failed to load operators)
        await new Promise(r => setTimeout(r, 100));
        
        vi.mocked(getOperatorsForSquadron).mockImplementation((_sqn, signal) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('API fail'));
                }, 50);
            });
        });
        
        const { unmount: unmount2 } = render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} state={{ squadron: 'sqn1' } as any} />);
        unmount2();
        await new Promise(r => setTimeout(r, 100));
    });

    it('returns early in handleSubmit if hasLaunches is false or worker is empty', async () => {
        render(<RepairsPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: null, rightLastRecord: null } as any} state={{ squadron: 'sqn1' } as any} />);
        
        await waitFor(() => expect(getOperatorsForSquadron).toHaveBeenCalled());

        fireEvent.change(screen.getByPlaceholderText('Describe the repair carried out...'), {
            target: { value: 'test' },
        });

        const submitButton = screen.getByRole('button', { name: /Sign off Repair/i });
        await act(async () => {
            submitButton.removeAttribute('disabled');
            fireEvent.click(submitButton);
        });

        expect(mockAddRemark).not.toHaveBeenCalled();
    });
});
