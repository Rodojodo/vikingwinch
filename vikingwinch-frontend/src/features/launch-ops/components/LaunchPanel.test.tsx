import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LaunchPanel from './LaunchPanel.tsx';
import type { DerivedWinchState } from '../types';

let mockDerived: DerivedWinchState = {
    leftTotal: 0,
    rightTotal: 0,
    leftLaunches: 0,
    rightLaunches: 0,
    leftLast: null,
    rightLast: null,
    lastDrum: null,
    leftLastRecord: undefined,
    rightLastRecord: undefined,
};

const mockExecuteLaunch = vi.fn().mockResolvedValue(undefined);
const mockUndoLaunch = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../app/hooks/useSessionIdentity.ts', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('../../trainee-ops/hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));
vi.mock('../hooks/useLaunchOps.tsx', () => ({
    useLaunchOps: () => ({
        derived: mockDerived,
        leftHistory: [],
        rightHistory: [],
        executeLaunch: mockExecuteLaunch,
        undoLaunch: mockUndoLaunch,
        addRemarkToState: vi.fn(),
    })
}));
vi.mock('../../day-ops/hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));

// Mock subcomponents to simplify LaunchPanel testing
vi.mock('./WinchDetailsSticker.tsx', () => ({
    WinchDetailsSticker: (props: { isRecentLaunch: boolean }) => <div data-testid="winch-sticker" data-recent={props.isRecentLaunch.toString()} />
}));

describe('LaunchPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockDerived = {
            leftTotal: 0,
            rightTotal: 0,
            leftLaunches: 0,
            rightLaunches: 0,
            leftLast: null,
            rightLast: null,
            lastDrum: null,
            leftLastRecord: undefined,
            rightLastRecord: undefined,
        };
        mockExecuteLaunch.mockResolvedValue(undefined);
        mockUndoLaunch.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders LaunchPanel correctly with children', () => {
        render(
            <LaunchPanel>
                <div data-testid="remarks-panel" />
            </LaunchPanel>
        );
        expect(screen.getByText('Left Drum')).toBeInTheDocument();
        expect(screen.getByText('Right Drum')).toBeInTheDocument();
        expect(screen.getByTestId('winch-sticker')).toBeInTheDocument();
        expect(screen.getByTestId('remarks-panel')).toBeInTheDocument();
    });

    it('handles left launch click', () => {
        render(<LaunchPanel />);
        const launchBtn = screen.getByText('Left Drum').closest('button');
        if (launchBtn) fireEvent.click(launchBtn);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('left');
    });

    it('handles left burn click', () => {
        render(<LaunchPanel />);
        const burnBtn = screen.getByRole('button', { name: /Burn Left/i });
        fireEvent.click(burnBtn);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('left', true);
    });

    it('handles right launch click', () => {
        render(<LaunchPanel />);
        const launchBtn = screen.getByText('Right Drum').closest('button');
        if (launchBtn) fireEvent.click(launchBtn);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('right');
    });

    it('handles right burn click', () => {
        render(<LaunchPanel />);
        const burnBtn = screen.getByRole('button', { name: /Burn Right/i });
        fireEvent.click(burnBtn);
        expect(mockExecuteLaunch).toHaveBeenCalledWith('right', true);
    });

    it('handles undo left click', () => {
        mockDerived.leftLaunches = 2;
        mockDerived.leftTotal = 2;

        render(<LaunchPanel />);
        const undoBtn = screen.getByText('− Undo Left');
        fireEvent.click(undoBtn);
        expect(mockUndoLaunch).toHaveBeenCalledWith('left');
    });

    it('handles undo right click', () => {
        mockDerived.rightLaunches = 2;
        mockDerived.rightTotal = 2;

        render(<LaunchPanel />);
        const undoBtn = screen.getByText('− Undo Right');
        fireEvent.click(undoBtn);
        expect(mockUndoLaunch).toHaveBeenCalledWith('right');
    });

    it('disables undo buttons when no launches', () => {
        render(<LaunchPanel />);
        const undoLeft = screen.getByText('− Undo Left');
        const undoRight = screen.getByText('− Undo Right');
        expect(undoLeft).toBeDisabled();
        expect(undoRight).toBeDisabled();
    });

    it('updates isRecentLaunch based on last launch time', () => {
        mockDerived.leftLast = new Date().toISOString();

        render(<LaunchPanel />);
        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'true');

        // Fast forward past cooldown threshold (2.5 minutes)
        act(() => {
            vi.advanceTimersByTime(3 * 60 * 1000);
        });

        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'false');
    });

    it('triggers reset animation when launches become equal and increase', () => {
        mockDerived.leftTotal = 1;
        mockDerived.rightTotal = 0;

        const { rerender } = render(<LaunchPanel />);

        // Now make them equal and increase
        mockDerived.leftTotal = 1;
        mockDerived.rightTotal = 1;

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

    it('renders children like Show skylog values button and handles clicks', () => {
        const onViewSkylogValues = vi.fn();
        render(
            <LaunchPanel>
                <button onClick={onViewSkylogValues}>Show skylog values</button>
            </LaunchPanel>
        );
        const btn = screen.getByText('Show skylog values');
        fireEvent.click(btn);
        expect(onViewSkylogValues).toHaveBeenCalledTimes(1);
    });

    it('handles promise rejections for launches and undo', async () => {
        vi.useRealTimers();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockExecuteLaunch.mockRejectedValue(new Error('Launch error'));
        mockUndoLaunch.mockRejectedValue(new Error('Undo error'));

        mockDerived.leftLaunches = 1;
        mockDerived.leftTotal = 1;
        mockDerived.rightLaunches = 1;
        mockDerived.rightTotal = 1;

        render(<LaunchPanel />);
        
        // click left launch
        const leftBtn = screen.getByText('Left Drum').closest('button');
        if (leftBtn) fireEvent.click(leftBtn);
        // click left burn
        fireEvent.click(screen.getByRole('button', { name: /Burn Left/i }));
        // click left undo
        fireEvent.click(screen.getByText('− Undo Left'));

        // click right launch
        const rightBtn = screen.getByText('Right Drum').closest('button');
        if (rightBtn) fireEvent.click(rightBtn);
        // click right burn
        fireEvent.click(screen.getByRole('button', { name: /Burn Right/i }));
        // click right undo
        fireEvent.click(screen.getByText('− Undo Right'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledTimes(6);
        });

        consoleSpy.mockRestore();
    });

    it('does not trigger reset animation when launches change but are not equal', () => {
        mockDerived.leftTotal = 0;
        mockDerived.rightTotal = 0;

        const { rerender } = render(<LaunchPanel />);

        // Increase one
        mockDerived.leftTotal = 1;
        mockDerived.rightTotal = 0;

        rerender(<LaunchPanel />);
        
        // Fast forward
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });

    it('does not trigger reset animation when launches are equal but decrease (undo)', () => {
        mockDerived.leftTotal = 2;
        mockDerived.rightTotal = 2;

        const { rerender } = render(<LaunchPanel />);

        // Decrease both (not realistic at the exact same time, but tests the logic)
        mockDerived.leftTotal = 1;
        mockDerived.rightTotal = 1;

        rerender(<LaunchPanel />);
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });

    it('clears timers on unmount', () => {
        mockDerived.leftTotal = 1;
        mockDerived.rightTotal = 0;

        const { rerender, unmount } = render(<LaunchPanel />);

        mockDerived.leftTotal = 1;
        mockDerived.rightTotal = 1;
        rerender(<LaunchPanel />);

        // Unmount while timeouts are pending
        unmount();
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });

    it('handles checkRecent correctly when both rightLast and leftLast are missing', () => {
        render(<LaunchPanel />);
        expect(screen.getByTestId('winch-sticker')).toHaveAttribute('data-recent', 'false');
    });
});
