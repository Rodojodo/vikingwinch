import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {WinchSelectPanel} from './WinchSelectPanel';
import {getWinchStatusesForSquadron} from '../api/winchClient.ts';

vi.mock('../api/winchClient.ts', () => ({
    getWinchStatusesForSquadron: vi.fn(),
}));

describe('WinchSelectPanel', () => {
    const mockOnSelectWinch = vi.fn();
    const squadronId = '123 VGS';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays a loading spinner initially', () => {
        vi.mocked(getWinchStatusesForSquadron).mockReturnValue(new Promise(() => {}));

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays winches when successfully fetched and calls onSelectWinch on click', async () => {
        const mockWinches = [
            { id: 1, registration: 'W1', squadron_id: squadronId, status: 'default' as const },
            { id: 2, registration: 'W2', squadron_id: squadronId, status: 'default' as const },
        ];
        vi.mocked(getWinchStatusesForSquadron).mockResolvedValue(mockWinches);

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const btn1 = await screen.findByRole('button', { name: 'Winch 1' });
        const btn2 = screen.getByRole('button', { name: 'Winch 2' });

        expect(btn1).toBeInTheDocument();
        expect(btn2).toBeInTheDocument();

        fireEvent.click(btn1);
        expect(mockOnSelectWinch).toHaveBeenCalledWith(1);
    });

    it('displays an error message when API call fails', async () => {
        vi.mocked(getWinchStatusesForSquadron).mockRejectedValue(new Error('API error'));

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const errorMsg = await screen.findByText('Failed to load winches');
        expect(errorMsg).toBeInTheDocument();
    });

    it('displays a message when no winches are returned', async () => {
        vi.mocked(getWinchStatusesForSquadron).mockResolvedValue([]);

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const emptyMsg = await screen.findByText('No winches available for this squadron.');
        expect(emptyMsg).toBeInTheDocument();
    });

    it('filters out winches that are already open', async () => {
        const mockWinches = [
            { id: 1, squadron_id: squadronId, registration: 'W1', status: 'default' as const },
            {id: 2, squadron_id: squadronId, registration: 'W2', status: 'default' as const},
        ];
        vi.mocked(getWinchStatusesForSquadron).mockResolvedValue(mockWinches);

        // Winch 1 is open
        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[1]} onSelectWinch={mockOnSelectWinch} />);

        // Winch 2 should appear
        const btn2 = await screen.findByRole('button', { name: 'Winch 2' });
        expect(btn2).toBeInTheDocument();

        // Winch 1 should NOT appear
        const btn1 = screen.queryByRole('button', { name: 'Winch 1' });
        expect(btn1).not.toBeInTheDocument();
    });

    it('renders all current-day states and keeps finished winches selectable', async () => {
        vi.mocked(getWinchStatusesForSquadron).mockResolvedValue([
            {id: 1, squadron_id: squadronId, registration: 'W1', status: 'default'},
            {id: 2, squadron_id: squadronId, registration: 'W2', status: 'di_complete'},
            {id: 3, squadron_id: squadronId, registration: 'W3', status: 'in_use'},
            {id: 4, squadron_id: squadronId, registration: 'W4', status: 'day_finished'},
        ]);

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        expect(await screen.findByRole('button', {name: 'Winch 1'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Winch 2\s*DI Complete/})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Winch 3\s*In use/})).toBeInTheDocument();
        const finishedButton = screen.getByRole('button', {name: /Winch 4\s*Day finished/});
        expect(finishedButton).toBeEnabled();

        fireEvent.click(finishedButton);
        expect(mockOnSelectWinch).toHaveBeenCalledWith(4);
    });
});
