import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyInspectionPanel } from './DailyInspectionPanel.tsx';
import { getWinchDrums, getWinchHours, postDayLogToDb } from '../api/dataClient.ts';

vi.mock('../api/dataClient.ts', () => ({
    getWinchDrums: vi.fn(),
    getWinchHours: vi.fn(),
    postDayLogToDb: vi.fn(),
}));

describe('DailyInspectionPanel', () => {
    const mockOnComplete = vi.fn();
    const mockSession = {
        state: {
            winchId: 42,
            squadron: 'sqn1',
            operatorSn: 'OP1'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component with inputs', () => {
        render(<DailyInspectionPanel session={mockSession as any} onComplete={mockOnComplete} />);
        expect(screen.getByText('Winch 42')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. 12')).toBeInTheDocument(); // left drum
        expect(screen.getByPlaceholderText('e.g. 5')).toBeInTheDocument(); // right drum
        expect(screen.getByPlaceholderText('e.g. 123.5')).toBeInTheDocument(); // hours
        expect(screen.getByRole('button', { name: 'Retrieve data from cloud' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign DI' })).toBeInTheDocument();
    });

    it('retrieves data from cloud and updates fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getWinchDrums).mockResolvedValue({ left_drum: 15, right_drum: 8 } as any);
        vi.mocked(getWinchHours).mockResolvedValue({ hours: 150.5 } as any);

        render(<DailyInspectionPanel session={mockSession as any} onComplete={mockOnComplete} />);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(screen.getByDisplayValue('15')).toBeInTheDocument();
            expect(screen.getByDisplayValue('8')).toBeInTheDocument();
            expect(screen.getByDisplayValue('150.5')).toBeInTheDocument();
        });
    });

    it('handles retrieve data missing fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getWinchDrums).mockResolvedValue({ left_drum: null, right_drum: undefined } as any);
        vi.mocked(getWinchHours).mockResolvedValue({ hours: null } as any);

        render(<DailyInspectionPanel session={mockSession as any} onComplete={mockOnComplete} />);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(getWinchDrums).toHaveBeenCalledWith(42);
        });

        // Fields should remain empty
        expect(screen.queryByDisplayValue('15')).not.toBeInTheDocument();
    });

    it('handles retrieve data api failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();

        vi.mocked(getWinchDrums).mockRejectedValue(new Error('Fetch drums failed'));
        vi.mocked(getWinchHours).mockRejectedValue(new Error('Fetch hours failed'));

        render(<DailyInspectionPanel session={mockSession as any} onComplete={mockOnComplete} />);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch drums', expect.any(Error));
            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch hours', expect.any(Error));
        });

        consoleSpy.mockRestore();
    });

    it('allows typing in fields and submitting', async () => {
        const user = userEvent.setup();
        vi.mocked(postDayLogToDb).mockResolvedValue({} as any);

        render(<DailyInspectionPanel session={mockSession as any} onComplete={mockOnComplete} />);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');
        await user.type(screen.getByPlaceholderText('e.g. 123.5'), '200.5');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(postDayLogToDb).toHaveBeenCalledWith({
            squadron_id: 'sqn1',
            winch_id: 42,
            operator_id: 'OP1',
            trainee: null,
            type: 'di',
            cable_check: null,
            hours: 200.5,
        }, 42);

        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('allows submitting with no hours', async () => {
        const user = userEvent.setup();
        vi.mocked(postDayLogToDb).mockResolvedValue({} as any);

        render(<DailyInspectionPanel session={mockSession as any} onComplete={mockOnComplete} />);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(postDayLogToDb).toHaveBeenCalledWith(expect.objectContaining({
            hours: null,
        }), 42);

        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('handles submit failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();
        vi.mocked(postDayLogToDb).mockRejectedValue(new Error('Submit failed'));

        render(<DailyInspectionPanel session={mockSession as any} onComplete={mockOnComplete} />);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to sign DI', expect.any(Error));
        });

        expect(mockOnComplete).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('does not submit if session data is missing', async () => {
        const user = userEvent.setup();
        const incompleteSession = {
            state: { winchId: null, squadron: null, operatorSn: null }
        };
        render(<DailyInspectionPanel session={incompleteSession as any} onComplete={mockOnComplete} />);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(postDayLogToDb).not.toHaveBeenCalled();
    });

    it('does not retrieve data if winchId is missing', async () => {
        const user = userEvent.setup();
        const incompleteSession = {
            state: { winchId: null, squadron: null, operatorSn: null }
        };
        render(<DailyInspectionPanel session={incompleteSession as any} onComplete={mockOnComplete} />);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        expect(getWinchDrums).not.toHaveBeenCalled();
    });
});