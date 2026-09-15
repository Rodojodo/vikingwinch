import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WinchSelectPanel } from './WinchSelectPanel';
import { getWinchesForSquadron } from "../..//winch-ops/api/winchClient.ts";


vi.mock('../../../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('../..//trainee-ops/hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));
vi.mock('../..//launch-ops/hooks/useLaunchOps.tsx', () => ({
    useLaunchOps: vi.fn(() => ({ 
        derived: { leftLastRecord: {}, rightLastRecord: {} }, 
        leftHistory: [], 
        rightHistory: [], 
        executeLaunch: vi.fn().mockResolvedValue(undefined), 
        undoLaunch: vi.fn().mockResolvedValue(undefined), 
        addRemarkToState: vi.fn() 
    }))
}));
vi.mock('../..//day-ops/hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));


vi.mock("../..//winch-ops/api/winchClient.ts", () => ({ getWinchesForSquadron: vi.fn() }));

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
        
        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);
        
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays winches when successfully fetched and calls onSelectWinch on click', async () => {
        const mockWinches = [
            { id: 1, registration: 'W1', squadron_id: squadronId },
            { id: 2, registration: 'W2', squadron_id: squadronId },
        ];
        vi.mocked(getWinchesForSquadron).mockResolvedValue(mockWinches);

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

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

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const errorMsg = await screen.findByText('Failed to load winches');
        expect(errorMsg).toBeInTheDocument();
    });

    it('displays a message when no winches are returned', async () => {
        vi.mocked(getWinchesForSquadron).mockResolvedValue([]);

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const emptyMsg = await screen.findByText('No winches available for this squadron.');
        expect(emptyMsg).toBeInTheDocument();
    });

    it('filters out winches that are already open', async () => {
        const mockWinches = [
            { id: 1, squadron_id: squadronId, registration: 'W1', name: 'Winch 1' },
            { id: 2, squadron_id: squadronId, registration: 'W1', name: 'Winch 1' }
        ];
        vi.mocked(getWinchesForSquadron).mockResolvedValue(mockWinches);

        // Winch 1 is open
        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[1]} onSelectWinch={mockOnSelectWinch} />);

        // Winch 2 should appear
        const btn2 = await screen.findByRole('button', { name: 'Winch 2' });
        expect(btn2).toBeInTheDocument();

        // Winch 1 should NOT appear
        const btn1 = screen.queryByRole('button', { name: 'Winch 1' });
        expect(btn1).not.toBeInTheDocument();
    });
});
