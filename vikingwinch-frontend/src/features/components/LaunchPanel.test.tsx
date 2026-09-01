import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LaunchPanel from './LaunchPanel';
import { useWinchSession } from '../hooks/useWinchSession';

vi.mock('../hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(),
}));

// Mock subcomponents to simplify LaunchPanel testing
vi.mock('../components/TraineeAssignmentPanel', () => ({
    TraineeAssignmentPanel: () => <div data-testid="trainee-panel" />
}));
vi.mock('../components/RemarksRepairsPanel', () => ({
    RemarksRepairsPanel: () => <div data-testid="remarks-panel" />
}));
vi.mock('../components/WinchDetailsSticker', () => ({
    WinchDetailsSticker: (props: any) => <div data-testid="winch-sticker" data-recent={props.isRecentLaunch.toString()} />
}));

describe('LaunchPanel', () => {
    const mockExecuteLaunch = vi.fn().mockResolvedValue(undefined);
    const mockUndoLaunch = vi.fn().mockResolvedValue(undefined);
    const mockChangeTrainee = vi.fn();
    const mockAddRemark = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        vi.mocked(useWinchSession).mockReturnValue({
            derived: {
                leftLaunches: 0,
                rightLaunches: 0,
                leftLast: null,
                rightLast: null,
            },
            isLoading: false,
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch,
            changeTrainee: mockChangeTrainee,
            addRemark: mockAddRemark,
            state: { squadron: 'sqn1', winchNum: 42 },
            error: null
        } as any);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders LaunchPanel correctly', () => {
        render(<LaunchPanel session={useWinchSession() as any} />);
        expect(screen.getByText('Left Drum')).toBeInTheDocument();
        expect(screen.getByText('Right Drum')).toBeInTheDocument();
        expect(screen.getByTestId('winch-sticker')).toBeInTheDocument();
        expect(screen.getByTestId('trainee-panel')).toBeInTheDocument();
        expect(screen.getByTestId('remarks-panel')).toBeInTheDocument();
    });

    it('handles left launch click', () => {
        render(<LaunchPanel session={useWinchSession() as any} />);
        const launchBtn = screen.getByText('Left Drum').closest('button');
        fireEvent.click(launchBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('left');
    });

    it('handles left burn click', () => {
        render(<LaunchPanel session={useWinchSession() as any} />);
        const burnBtn = screen.getByRole('button', { name: /Burn Left/i });
        fireEvent.click(burnBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('left', true);
    });

    it('handles right launch click', () => {
        render(<LaunchPanel session={useWinchSession() as any} />);
        const launchBtn = screen.getByText('Right Drum').closest('button');
        fireEvent.click(launchBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('right');
    });

    it('handles right burn click', () => {
        render(<LaunchPanel session={useWinchSession() as any} />);
        const burnBtn = screen.getByRole('button', { name: /Burn Right/i });
        fireEvent.click(burnBtn!);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('right', true);
    });

    it('handles undo left click', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 0 },
            isLoading: false,
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch,
            state: { squadron: 'sqn1', winchNum: 42 }
        } as any);
        render(<LaunchPanel session={useWinchSession() as any} />);
        const undoBtn = screen.getByText('− Undo Left');
        fireEvent.click(undoBtn);
        expect(mockUndoLaunch).toHaveBeenCalledWith('left');
    });

    it('handles undo right click', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            derived: { leftLaunches: 0, rightLaunches: 1 },
            isLoading: false,
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch,
            state: { squadron: 'sqn1', winchNum: 42 }
        } as any);
        render(<LaunchPanel session={useWinchSession() as any} />);
        const undoBtn = screen.getByText('− Undo Right');
        fireEvent.click(undoBtn);
        expect(mockUndoLaunch).toHaveBeenCalledWith('right');
    });

    it('disables undo buttons when no launches', () => {
        render(<LaunchPanel session={useWinchSession() as any} />);
        const undoLeft = screen.getByText('− Undo Left');
        const undoRight = screen.getByText('− Undo Right');
        expect(undoLeft).toBeDisabled();
        expect(undoRight).toBeDisabled();
    });

    it('updates isRecentLaunch based on last launch time', () => {
        const now = new Date();
        const recentTime = new Date(now.getTime() - 1000).toISOString(); // 1 second ago

        vi.mocked(useWinchSession).mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 0, leftLast: recentTime, rightLast: null },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        render(<LaunchPanel session={useWinchSession() as any} />);
        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'true');

        // Fast forward 16 minutes
        act(() => {
            vi.advanceTimersByTime(16 * 60 * 1000);
        });

        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'false');
    });

    it('triggers reset animation when launches become equal and increase', () => {
        const mockUseWinchSession = vi.mocked(useWinchSession);
        
        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 0, leftLast: null, rightLast: null },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        const { rerender } = render(<LaunchPanel session={useWinchSession() as any} />);

        // Now make them equal and increase
        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 1, leftLast: null, rightLast: null },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        rerender(<LaunchPanel session={useWinchSession() as any} />);

        // Fast forward to trigger the reset animation setTimeout
        act(() => {
            vi.advanceTimersByTime(400);
        });

        // Fast forward to clear animation
        act(() => {
            vi.advanceTimersByTime(700);
        });
    });
});
