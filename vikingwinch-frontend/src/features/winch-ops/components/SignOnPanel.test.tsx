import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignOnPanel } from './SignOnPanel.tsx';
import { getOperatorsForSquadron } from '../api/dataClient.ts';

vi.mock('../api/dataClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

describe('SignOnPanel', () => {
    const mockRecordSignOn = vi.fn();
    const mockOnComplete = vi.fn();

    const mockSession = {
        state: {
            squadron: 'sqn1',
            operatorSn: 'OP1',
            winchId: 42
        },
        recordSignOn: mockRecordSignOn,
        isLoading: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { service_no: 'OP1', name: 'Geronimo Jones', squadron_id: 'sqn1' },
            { service_no: 'OP2', name: 'Charlie Bloggs', squadron_id: 'sqn1' }
        ]);
        mockRecordSignOn.mockResolvedValue(undefined);
    });

    it('renders winch ID, operators, and already inspected message', async () => {
        render(<SignOnPanel session={mockSession as any} onComplete={mockOnComplete} alreadyInspected={true} />);

        // Wait for fetching to finish
        await waitFor(() => {
            expect(screen.queryByText('— None —')).toBeInTheDocument();
        });

        expect(screen.getByText('Winch 42')).toBeInTheDocument();
        expect(screen.getByText('Current operator: Geronimo Jones')).toBeInTheDocument();
        expect(screen.getByText('This winch has already been inspected today.')).toBeInTheDocument();
    });

    it('does not show already inspected message if false', async () => {
        render(<SignOnPanel session={mockSession as any} onComplete={mockOnComplete} alreadyInspected={false} />);
        
        await waitFor(() => {
            expect(screen.queryByText('— None —')).toBeInTheDocument();
        });

        expect(screen.queryByText('This winch has already been inspected today.')).not.toBeInTheDocument();
    });

    it('allows selecting a trainee and updates the current operator text', async () => {
        const user = userEvent.setup();
        render(<SignOnPanel session={mockSession as any} onComplete={mockOnComplete} alreadyInspected={false} />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.click(select);

        const listbox = screen.getByRole('listbox');
        const traineeOption = within(listbox).getByRole('option', { name: 'Charlie Bloggs' });
        await user.click(traineeOption);

        expect(screen.getByText('Current operator: Geronimo Jones & Charlie Bloggs')).toBeInTheDocument();
    });

    it('submits sign on and calls onComplete when clicking Walkaround complete', async () => {
        const user = userEvent.setup();
        render(<SignOnPanel session={mockSession as any} onComplete={mockOnComplete} alreadyInspected={false} />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('combobox'));
        await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Charlie Bloggs' }));

        const btn = screen.getByRole('button', { name: /Walkaround complete/i });
        await user.click(btn);

        expect(mockRecordSignOn).toHaveBeenCalledWith('OP2');
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('handles sign on failure gracefully without calling onComplete', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockRecordSignOn.mockRejectedValue(new Error('Network error'));
        
        const user = userEvent.setup();
        render(<SignOnPanel session={mockSession as any} onComplete={mockOnComplete} alreadyInspected={false} />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const btn = screen.getByRole('button', { name: /Walkaround complete/i });
        await user.click(btn);

        expect(mockRecordSignOn).toHaveBeenCalledWith(null);
        expect(mockOnComplete).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Sign on failed', expect.any(Error));
        
        consoleSpy.mockRestore();
    });

    it('disables the submit button when isLoading is true', () => {
        render(<SignOnPanel session={{ ...mockSession, isLoading: true } as any} onComplete={mockOnComplete} alreadyInspected={false} />);
        
        const btn = screen.getByRole('button', { name: /Walkaround complete/i });
        expect(btn).toBeDisabled();
    });

    it('handles fetch operators rejection', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(getOperatorsForSquadron).mockRejectedValueOnce(new Error('Fetch failed'));

        render(<SignOnPanel session={mockSession as any} onComplete={mockOnComplete} alreadyInspected={false} />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        consoleSpy.mockRestore();
    });
});
