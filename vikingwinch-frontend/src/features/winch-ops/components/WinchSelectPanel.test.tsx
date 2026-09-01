import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WinchSelectPanel } from './WinchSelectPanel';
import { getWinchesForSquadron } from '../api/dataClient';

vi.mock('../api/dataClient', () => ({
    getWinchesForSquadron: vi.fn(),
}));

describe('WinchSelectPanel', () => {
    const mockOnSelectWinch = vi.fn();
    const squadronId = '123 VGS';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays a loading spinner initially', () => {
        // Return a promise that doesn't resolve immediately to check the loading state
        vi.mocked(getWinchesForSquadron).mockReturnValue(new Promise(() => {}));
        
        render(<WinchSelectPanel squadronId={squadronId} onSelectWinch={mockOnSelectWinch} />);
        
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays winches when successfully fetched and calls onSelectWinch on click', async () => {
        const mockWinches = [
            { id: 1, registration: 'W1', squadron_id: squadronId },
            { id: 2, registration: 'W2', squadron_id: squadronId },
        ];
        vi.mocked(getWinchesForSquadron).mockResolvedValue(mockWinches);

        render(<WinchSelectPanel squadronId={squadronId} onSelectWinch={mockOnSelectWinch} />);

        // Wait for loading to finish and buttons to appear
        const btn1 = await screen.findByRole('button', { name: 'Winch 1' });
        const btn2 = screen.getByRole('button', { name: 'Winch 2' });

        expect(btn1).toBeInTheDocument();
        expect(btn2).toBeInTheDocument();

        fireEvent.click(btn1);
        expect(mockOnSelectWinch).toHaveBeenCalledWith(1);
    });

    it('displays an error message when API call fails', async () => {
        vi.mocked(getWinchesForSquadron).mockRejectedValue(new Error('API error'));

        render(<WinchSelectPanel squadronId={squadronId} onSelectWinch={mockOnSelectWinch} />);

        const errorMsg = await screen.findByText('Failed to load winches');
        expect(errorMsg).toBeInTheDocument();
    });

    it('displays a message when no winches are returned', async () => {
        vi.mocked(getWinchesForSquadron).mockResolvedValue([]);

        render(<WinchSelectPanel squadronId={squadronId} onSelectWinch={mockOnSelectWinch} />);

        const emptyMsg = await screen.findByText('No winches available for this squadron.');
        expect(emptyMsg).toBeInTheDocument();
    });
});
