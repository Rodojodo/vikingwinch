import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemarksPanel } from './RemarksPanel';
import { useWinchSession } from '../hooks/useWinchSession';

vi.mock('../hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(),
}));

describe('RemarksPanel', () => {
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

    it('renders RemarksPanel correctly', () => {
        render(<RemarksPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} />);
        expect(screen.getByText('Launch remarks')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter launch remarks...')).toBeInTheDocument();
    });

    it('submits remark when button is clicked', async () => {
        render(<RemarksPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} />);
        
        fireEvent.change(screen.getByPlaceholderText('Enter launch remarks...'), {
            target: { value: 'Test remark' },
        });

        const submitButton = screen.getByRole('button', { name: /Submit Remark/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(mockAddRemark).toHaveBeenCalledWith('Test remark', 'left');
    });

    it('shows error alert when submission fails', async () => {
        mockAddRemark.mockRejectedValue(new Error('Test local Error'));
        render(<RemarksPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} />);
        
        fireEvent.change(screen.getByPlaceholderText('Enter launch remarks...'), {
            target: { value: 'Test remark' },
        });

        const submitButton = screen.getByRole('button', { name: /Submit Remark/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Test local Error')).toBeInTheDocument();
        });
    });

    it('disables submit button and shows text when no launches', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            addRemark: mockAddRemark,
            isLoading: false,
            error: null,
            derived: { leftLastRecord: null, rightLastRecord: null },
        } as any);

        render(<RemarksPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: null, rightLastRecord: null } as any} />);
        expect(screen.getByText('No launches yet')).toBeInTheDocument();
        const submitButton = screen.getByRole('button', { name: /Submit Remark/i });
        expect(submitButton).toBeDisabled();
    });
    
    it('catches and swallows error thrown by addRemark', async () => {
        mockAddRemark.mockRejectedValue(new Error('Add remark failed'));
        render(<RemarksPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} />);
        
        fireEvent.change(screen.getByPlaceholderText('Enter launch remarks...'), {
            target: { value: 'Test remark' },
        });

        const submitButton = screen.getByRole('button', { name: /Submit Remark/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(mockAddRemark).toHaveBeenCalled();
        });
        // State remark is not cleared if it throws, so we expect 'Test remark' to still be there
        expect(screen.getByPlaceholderText('Enter launch remarks...')).toHaveValue('Test remark');
    });

    it('does not submit if remark is empty', () => {
        render(<RemarksPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} />);
        const submitButton = screen.getByRole('button', { name: /Submit Remark/i });
        expect(submitButton).toBeDisabled();
    });

    it('blocks remarks starting with Repair', async () => {
        render(<RemarksPanel addRemark={mockAddRemark} isLoading={false} derived={{ leftLastRecord: {}, rightLastRecord: {} } as any} />);
        
        fireEvent.change(screen.getByPlaceholderText('Enter launch remarks...'), {
            target: { value: 'Repair: broken cable' },
        });

        const submitButton = screen.getByRole('button', { name: /Submit Remark/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(mockAddRemark).not.toHaveBeenCalled();
        expect(screen.getByText('Repairs should be logged in the Repairs tab')).toBeInTheDocument();
    });
});
