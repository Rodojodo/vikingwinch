import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {DailyInspectionPanel} from './DailyInspectionPanel.tsx';
import {useSessionIdentity} from '../../../app/providers/SessionIdentityProvider.tsx';
import {getBroughtForward, getWinchHours} from '../api/winchClient.ts';

vi.mock('../../../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1'})),
}));

vi.mock('../api/winchClient.ts', () => ({
    getBroughtForward: vi.fn(),
    getWinchHours: vi.fn(),
}));

describe('DailyInspectionPanel', () => {
    const mockOnComplete = vi.fn();
    const mockOnSignDI = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component with inputs', () => {
        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);
        expect(screen.getByText('Winch 42')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. 12')).toBeInTheDocument(); // left drum
        expect(screen.getByPlaceholderText('e.g. 5')).toBeInTheDocument(); // right drum
        expect(screen.getByPlaceholderText('e.g. 123.5')).toBeInTheDocument(); // hours
        expect(screen.getByRole('button', { name: 'Retrieve data from cloud' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign DI' })).toBeInTheDocument();
    });

    it('retrieves data from cloud and updates fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({brought_forward: 15} as any);
        vi.mocked(getWinchHours).mockResolvedValue({hours: 150.5});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(screen.getByDisplayValue('150.5')).toBeInTheDocument();
        });
    });

    it('handles retrieve data missing fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({brought_forward: 0} as any);
        vi.mocked(getWinchHours).mockResolvedValue({hours: null as any});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(getBroughtForward).toHaveBeenCalledWith(42, expect.any(String));
        });

        expect(screen.queryByDisplayValue('15')).not.toBeInTheDocument();
    });

    it('handles retrieve data api failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();

        vi.mocked(getBroughtForward).mockRejectedValue(new Error('Fetch drums failed'));
        vi.mocked(getWinchHours).mockRejectedValue(new Error('Fetch hours failed'));

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

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
        mockOnSignDI.mockResolvedValue(undefined);

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');
        await user.type(screen.getByPlaceholderText('e.g. 123.5'), '200.5');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(mockOnSignDI).toHaveBeenCalledWith(200.5);
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('allows submitting with no hours', async () => {
        const user = userEvent.setup();
        mockOnSignDI.mockResolvedValue(undefined);

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(mockOnSignDI).toHaveBeenCalledWith(null);
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('handles submit failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();
        mockOnSignDI.mockRejectedValue(new Error('Submit failed'));

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to sign DI', expect.any(Error));
        });

        expect(mockOnComplete).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('does not submit if session data is missing', async () => {
        vi.mocked(useSessionIdentity).mockReturnValue({squadronId: '', winchId: null, operatorSn: ''});

        const user = userEvent.setup();
        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(mockOnSignDI).not.toHaveBeenCalled();
    });

    it('does not retrieve data if winchId is missing', async () => {
        vi.mocked(useSessionIdentity).mockReturnValue({squadronId: 'sqn1', winchId: null, operatorSn: 'OP1'});

        const user = userEvent.setup();
        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        expect(getBroughtForward).not.toHaveBeenCalled();
    });
});
