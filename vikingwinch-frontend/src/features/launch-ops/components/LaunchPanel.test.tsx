import {act, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import LaunchPanel from './LaunchPanel.tsx';



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




// Mock subcomponents to simplify LaunchPanel testing
vi.mock('../../day-ops/components/TraineeAssignmentPanel.tsx', () => ({
    TraineeAssignmentPanel: () => <div data-testid="trainee-panel" />
}));
vi.mock('../../remarks-repairs/components/RemarksRepairsPanel.tsx', () => ({
    RemarksRepairsPanel: () => <div data-testid="remarks-panel" />
}));
vi.mock('./WinchDetailsSticker.tsx', () => ({
    WinchDetailsSticker: (props: any) => <div data-testid="winch-sticker" data-recent={props.isRecentLaunch.toString()} />
}));

describe('LaunchPanel', () => {
    const mockExecuteLaunch = vi.fn().mockResolvedValue(undefined);
    const mockUndoLaunch = vi.fn().mockResolvedValue(undefined);
        
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.skip('renders LaunchPanel correctly', () => {
        render(<LaunchPanel />);
        expect(screen.getByText('Left Drum')).toBeInTheDocument();
        expect(screen.getByText('Right Drum')).toBeInTheDocument();
        expect(screen.getByTestId('winch-sticker')).toBeInTheDocument();
        expect(screen.getByTestId('remarks-panel')).toBeInTheDocument();
    });

    it.skip('handles left launch click', () => {
        render(<LaunchPanel />);
        const launchBtn = screen.getByText('Left Drum').closest('button');
        fireEvent.click(launchBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('left');
    });

    it.skip('handles left burn click', () => {
        render(<LaunchPanel />);
        const burnBtn = screen.getByRole('button', { name: /Burn Left/i });
        fireEvent.click(burnBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('left', true);
    });

    it.skip('handles right launch click', () => {
        render(<LaunchPanel />);
        const launchBtn = screen.getByText('Right Drum').closest('button');
        fireEvent.click(launchBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('right');
    });

    it.skip('handles right burn click', () => {
        render(<LaunchPanel />);
        const burnBtn = screen.getByRole('button', { name: /Burn Right/i });
        fireEvent.click(burnBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('right', true);
    });

    it.skip('handles undo left click', () => {
        
        render(<LaunchPanel />);
        const undoBtn = screen.getByText('− Undo Left');
        fireEvent.click(undoBtn);
        expect(mockUndoLaunch).toHaveBeenCalledWith('left');
    });

    it.skip('handles undo right click', () => {
        
        render(<LaunchPanel />);
        const undoBtn = screen.getByText('− Undo Right');
        fireEvent.click(undoBtn);
        expect(mockUndoLaunch).toHaveBeenCalledWith('right');
    });

    it.skip('disables undo buttons when no launches', () => {
        render(<LaunchPanel />);
        const undoLeft = screen.getByText('− Undo Left');
        const undoRight = screen.getByText('− Undo Right');
        expect(undoLeft).toBeDisabled();
        expect(undoRight).toBeDisabled();
    });

    it.skip('updates isRecentLaunch based on last launch time', () => {
        
        

        render(<LaunchPanel />);
        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'true');

        // Fast forward 16 minutes
        act(() => {
            vi.advanceTimersByTime(16 * 60 * 1000);
        });

        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'false');
    });

    it.skip('triggers reset animation when launches become equal and increase', () => {
        
        
        

        const { rerender } = render(<LaunchPanel />);

        // Now make them equal and increase
        

        rerender(<LaunchPanel />);

        // Fast forward to trigger the reset animation setTimeout
        act(() => {
            vi.advanceTimersByTime(400);
        });

        // Fast forward to clear animation
        act(() => {
            vi.advanceTimersByTime(700);
        });
    });
    it.skip('calls onViewSkylogValues when button is clicked', () => {
        const onViewSkylogValues = vi.fn();
        render(<LaunchPanel />);
        const btn = screen.getByText('Show skylog values');
        fireEvent.click(btn);
        expect(onViewSkylogValues).toHaveBeenCalled();
    });

    it.skip('handles promise rejections for launches and undo', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
                
        

        render(<LaunchPanel />);
        
        // click left launch
        fireEvent.click(screen.getByText('Left Drum').closest('button')!);
        // click left burn
        fireEvent.click(screen.getByRole('button', { name: /Burn Left/i }));
        // click left undo
        fireEvent.click(screen.getByText('− Undo Left'));

        // click right launch
        fireEvent.click(screen.getByText('Right Drum').closest('button')!);
        // click right burn
        fireEvent.click(screen.getByRole('button', { name: /Burn Right/i }));
        // click right undo
        fireEvent.click(screen.getByText('− Undo Right'));

        // wait for promises to reject
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(consoleSpy).toHaveBeenCalledTimes(6);
        consoleSpy.mockRestore();
    });

    it.skip('does not trigger reset animation when launches change but are not equal', () => {
        
        

        const { rerender } = render(<LaunchPanel />);

        // Increase one
        

        rerender(<LaunchPanel />);
        
        // Fast forward
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        // We just ensure it doesn't crash and we hit the branch.
    });

    it.skip('does not trigger reset animation when launches are equal but decrease (undo)', () => {
        
        

        const { rerender } = render(<LaunchPanel />);

        // Decrease both (not realistic at the exact same time, but tests the logic)
        

        rerender(<LaunchPanel />);
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });

    it.skip('clears timers on unmount', () => {
        
        

        const { rerender, unmount } = render(<LaunchPanel />);

        
        rerender(<LaunchPanel />);

        // Unmount while timeouts are pending
        unmount();
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });

    it.skip('handles checkRecent correctly when both rightLast and leftLast are missing', () => {
        

        render(<LaunchPanel />);
        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'false');
    });
});
