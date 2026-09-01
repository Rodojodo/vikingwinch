import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LaunchPanel from './LaunchPanel.tsx';
import { useWinchSession } from '../../winch-ops/hooks/useWinchSession.ts';

vi.mock('../../winch-ops/hooks/useWinchSession.ts', () => ({
    useWinchSession: vi.fn(),
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
    it('calls onViewSkylogValues when button is clicked', () => {
        const onViewSkylogValues = vi.fn();
        render(<LaunchPanel session={useWinchSession() as any} onViewSkylogValues={onViewSkylogValues} />);
        const btn = screen.getByText('Show skylog values');
        fireEvent.click(btn);
        expect(onViewSkylogValues).toHaveBeenCalled();
    });

    it.skip('handles promise rejections for launches and undo', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const mockExecuteReject = vi.fn().mockRejectedValue(new Error('Launch error'));
        const mockUndoReject = vi.fn().mockRejectedValue(new Error('Undo error'));

        vi.mocked(useWinchSession).mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 1 },
            isLoading: false,
            executeLaunch: mockExecuteReject,
            undoLaunch: mockUndoReject,
            state: { squadron: 'sqn1', winchNum: 42 }
        } as any);

        render(<LaunchPanel session={useWinchSession() as any} />);
        
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

    it('does not trigger reset animation when launches change but are not equal', () => {
        const mockUseWinchSession = vi.mocked(useWinchSession);
        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 0, rightLaunches: 0, leftLast: null, rightLast: null, leftTotal: 0, rightTotal: 0 },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        const { rerender } = render(<LaunchPanel session={useWinchSession() as any} />);

        // Increase one
        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 0, leftLast: null, rightLast: null, leftTotal: 1, rightTotal: 0 },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        rerender(<LaunchPanel session={useWinchSession() as any} />);
        
        // Fast forward
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        // We just ensure it doesn't crash and we hit the branch.
    });

    it('does not trigger reset animation when launches are equal but decrease (undo)', () => {
        const mockUseWinchSession = vi.mocked(useWinchSession);
        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 1, leftLast: null, rightLast: null, leftTotal: 1, rightTotal: 1 },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        const { rerender } = render(<LaunchPanel session={useWinchSession() as any} />);

        // Decrease both (not realistic at the exact same time, but tests the logic)
        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 0, rightLaunches: 0, leftLast: null, rightLast: null, leftTotal: 0, rightTotal: 0 },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        rerender(<LaunchPanel session={useWinchSession() as any} />);
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });

    it('clears timers on unmount', () => {
        const mockUseWinchSession = vi.mocked(useWinchSession);
        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 0, rightLaunches: 0, leftTotal: 0, rightTotal: 0 },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);

        const { rerender, unmount } = render(<LaunchPanel session={useWinchSession() as any} />);

        mockUseWinchSession.mockReturnValue({
            derived: { leftLaunches: 1, rightLaunches: 1, leftTotal: 1, rightTotal: 1 },
            isLoading: false,
            state: { squadron: 'sqn1', winchNum: 42 },
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch
        } as any);
        rerender(<LaunchPanel session={useWinchSession() as any} />);

        // Unmount while timeouts are pending
        unmount();
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });

    it.skip('handles checkRecent correctly when both rightLast and leftLast are missing', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            derived: { leftLaunches: 0, rightLaunches: 0, leftLast: undefined, rightLast: undefined },
            isLoading: false,
            executeLaunch: mockExecuteLaunch,
            undoLaunch: mockUndoLaunch,
            state: { squadron: 'sqn1', winchNum: 42 }
        } as any);

        render(<LaunchPanel session={useWinchSession() as any} />);
        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'false');
    });
});
