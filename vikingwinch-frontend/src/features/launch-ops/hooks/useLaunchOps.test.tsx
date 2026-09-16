import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LaunchOpsProvider, useLaunchOps } from './useLaunchOps';
import { SessionIdentityProvider } from '../../../app/providers/SessionIdentityProvider';
import { TraineeOpsProvider } from '../../trainee-ops/hooks/useTraineeOps';
import { postLaunchToDb, removeLaunchFromDb } from '../api/launchClient';
import type { LaunchResponse } from '../types';

vi.mock('../api/launchClient', () => ({
    postLaunchToDb: vi.fn(),
    removeLaunchFromDb: vi.fn(),
}));

let opsContext: ReturnType<typeof useLaunchOps> | null = null;

const ConsumerComponent: React.FC = () => {
    opsContext = useLaunchOps();
    return (
        <div>
            <span data-testid="left-total">{opsContext.derived.leftTotal}</span>
            <span data-testid="right-total">{opsContext.derived.rightTotal}</span>
            <span data-testid="left-launches">{opsContext.derived.leftLaunches}</span>
            <span data-testid="right-launches">{opsContext.derived.rightLaunches}</span>
            <span data-testid="last-drum">{opsContext.derived.lastDrum ?? 'none'}</span>
        </div>
    );
};

const renderWithProviders = (winchId: number | null = 1, operatorSn: string = 'OP-1234') => {
    opsContext = null;
    return render(
        <SessionIdentityProvider squadronId="621 VGS" operatorSn={operatorSn} winchId={winchId}>
            <TraineeOpsProvider>
                <LaunchOpsProvider>
                    <ConsumerComponent />
                </LaunchOpsProvider>
            </TraineeOpsProvider>
        </SessionIdentityProvider>
    );
};

describe('useLaunchOps', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        opsContext = null;
    });

    it('throws error when used outside LaunchOpsProvider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            render(<ConsumerComponent />);
        }).toThrow('useLaunchOps must be used within LaunchOpsProvider');

        consoleSpy.mockRestore();
    });

    it('initializes with empty histories and zero derived counts', () => {
        renderWithProviders();

        expect(screen.getByTestId('left-total')).toHaveTextContent('0');
        expect(screen.getByTestId('right-total')).toHaveTextContent('0');
        expect(screen.getByTestId('left-launches')).toHaveTextContent('0');
        expect(screen.getByTestId('right-launches')).toHaveTextContent('0');
        expect(screen.getByTestId('last-drum')).toHaveTextContent('none');
        expect(opsContext?.derived.leftLast).toBeNull();
        expect(opsContext?.derived.rightLast).toBeNull();
    });

    it('throws error in executeLaunch if winchId is null', async () => {
        renderWithProviders(null);

        await expect(opsContext!.executeLaunch('left')).rejects.toThrow('Winch not selected');
    });

    it('successfully executes a launch and updates history & derived values', async () => {
        const mockResponse: LaunchResponse = {
            id: 10,
            launch_number: 1,
            timestamp: '2026-09-16T10:00:00Z',
            drum: 'left',
            operator_sn: 'OP-1234',
            squadron_id: '621 VGS',
            winch_id: 1,
            cable_id: null,
            created_at: '2026-09-16T10:00:00Z',
            day: '2026-09-16',
            remark: null,
        };
        vi.mocked(postLaunchToDb).mockResolvedValue(mockResponse);

        renderWithProviders(1, 'OP-1234');

        await act(async () => {
            await opsContext!.executeLaunch('left', false);
        });

        expect(postLaunchToDb).toHaveBeenCalledWith({
            winch_id: 1,
            operator_sn: 'OP-1234',
            drum: 'left',
            burn: false,
            trainee: null,
        });

        expect(screen.getByTestId('left-total')).toHaveTextContent('1');
        expect(screen.getByTestId('left-launches')).toHaveTextContent('1');
        expect(screen.getByTestId('last-drum')).toHaveTextContent('left');
    });

    it('handles burn launches correctly by excluding from launches count', async () => {
        const mockResponse: LaunchResponse = {
            id: 11,
            launch_number: null,
            timestamp: '2026-09-16T10:05:00Z',
            drum: 'right',
            operator_sn: 'OP-1234',
            squadron_id: '621 VGS',
            winch_id: 1,
            cable_id: null,
            created_at: '2026-09-16T10:05:00Z',
            day: '2026-09-16',
            remark: null,
        };
        vi.mocked(postLaunchToDb).mockResolvedValue(mockResponse);

        renderWithProviders(1, 'OP-1234');

        await act(async () => {
            await opsContext!.executeLaunch('right', true);
        });

        expect(screen.getByTestId('right-total')).toHaveTextContent('1');
        expect(screen.getByTestId('right-launches')).toHaveTextContent('0');
        expect(screen.getByTestId('last-drum')).toHaveTextContent('right');
    });

    it('throws error in undoLaunch when no launch exists for that drum', async () => {
        renderWithProviders(1);

        await expect(opsContext!.undoLaunch('left')).rejects.toThrow('No launches to undo');
        await expect(opsContext!.undoLaunch('right')).rejects.toThrow('No launches to undo');
    });

    it('successfully undos a launch on left drum and right drum', async () => {
        const leftResponse: LaunchResponse = {
            id: 50,
            launch_number: 1,
            timestamp: '2026-09-16T10:00:00Z',
            drum: 'left',
            operator_sn: 'OP-1234',
            squadron_id: '621 VGS',
            winch_id: 1,
            cable_id: null,
            created_at: '2026-09-16T10:00:00Z',
            day: '2026-09-16',
            remark: null,
        };
        const rightResponse: LaunchResponse = {
            id: 51,
            launch_number: 2,
            timestamp: '2026-09-16T10:10:00Z',
            drum: 'right',
            operator_sn: 'OP-1234',
            squadron_id: '621 VGS',
            winch_id: 1,
            cable_id: null,
            created_at: '2026-09-16T10:10:00Z',
            day: '2026-09-16',
            remark: null,
        };
        vi.mocked(postLaunchToDb).mockResolvedValueOnce(leftResponse).mockResolvedValueOnce(rightResponse);
        vi.mocked(removeLaunchFromDb).mockResolvedValue(undefined);

        renderWithProviders(1);

        await act(async () => {
            await opsContext!.executeLaunch('left', false);
            await opsContext!.executeLaunch('right', false);
        });
        expect(screen.getByTestId('left-total')).toHaveTextContent('1');
        expect(screen.getByTestId('right-total')).toHaveTextContent('1');

        await act(async () => {
            await opsContext!.undoLaunch('right');
        });
        expect(removeLaunchFromDb).toHaveBeenCalledWith(51);
        expect(screen.getByTestId('right-total')).toHaveTextContent('0');

        await act(async () => {
            await opsContext!.undoLaunch('left');
        });
        expect(removeLaunchFromDb).toHaveBeenCalledWith(50);
        expect(screen.getByTestId('left-total')).toHaveTextContent('0');
    });

    it('hydrates history from backend records and calculates lastDrum by timestamp', () => {
        renderWithProviders(1);

        const pastLaunches: LaunchResponse[] = [
            {
                id: 1,
                launch_number: 1,
                timestamp: '2026-09-16T09:00:00Z',
                drum: 'left',
                operator_sn: 'OP1',
                squadron_id: '621 VGS',
                winch_id: 1,
                cable_id: null,
                created_at: '2026-09-16T09:00:00Z',
                day: '2026-09-16',
                remark: null,
            },
            {
                id: 2,
                launch_number: 2,
                timestamp: '2026-09-16T09:10:00Z',
                drum: 'right',
                operator_sn: 'OP1',
                squadron_id: '621 VGS',
                winch_id: 1,
                cable_id: null,
                created_at: '2026-09-16T09:10:00Z',
                day: '2026-09-16',
                remark: null,
            },
        ];

        act(() => {
            opsContext!.hydrateHistory(pastLaunches);
        });

        expect(screen.getByTestId('left-total')).toHaveTextContent('1');
        expect(screen.getByTestId('right-total')).toHaveTextContent('1');
        expect(screen.getByTestId('last-drum')).toHaveTextContent('right');
    });

    it('correctly calculates lastDrum when only left exists or only right exists', () => {
        renderWithProviders(1);

        const leftOnly: LaunchResponse[] = [
            {
                id: 1,
                launch_number: 1,
                timestamp: '2026-09-16T09:00:00Z',
                drum: 'left',
                operator_sn: 'OP1',
                squadron_id: '621 VGS',
                winch_id: 1,
                cable_id: null,
                created_at: '2026-09-16T09:00:00Z',
                day: '2026-09-16',
                remark: null,
            },
        ];

        act(() => {
            opsContext!.hydrateHistory(leftOnly);
        });
        expect(screen.getByTestId('last-drum')).toHaveTextContent('left');

        const rightOnly: LaunchResponse[] = [
            {
                id: 2,
                launch_number: 1,
                timestamp: '2026-09-16T09:00:00Z',
                drum: 'right',
                operator_sn: 'OP1',
                squadron_id: '621 VGS',
                winch_id: 1,
                cable_id: null,
                created_at: '2026-09-16T09:00:00Z',
                day: '2026-09-16',
                remark: null,
            },
        ];

        act(() => {
            opsContext!.hydrateHistory(rightOnly);
        });
        expect(screen.getByTestId('last-drum')).toHaveTextContent('right');
    });

    it('correctly calculates lastDrum when left is newer than right', () => {
        renderWithProviders(1);

        const pastLaunches: LaunchResponse[] = [
            {
                id: 1,
                launch_number: 1,
                timestamp: '2026-09-16T09:30:00Z',
                drum: 'left',
                operator_sn: 'OP1',
                squadron_id: '621 VGS',
                winch_id: 1,
                cable_id: null,
                created_at: '2026-09-16T09:30:00Z',
                day: '2026-09-16',
                remark: null,
            },
            {
                id: 2,
                launch_number: 2,
                timestamp: '2026-09-16T09:10:00Z',
                drum: 'right',
                operator_sn: 'OP1',
                squadron_id: '621 VGS',
                winch_id: 1,
                cable_id: null,
                created_at: '2026-09-16T09:10:00Z',
                day: '2026-09-16',
                remark: null,
            },
        ];

        act(() => {
            opsContext!.hydrateHistory(pastLaunches);
        });

        expect(screen.getByTestId('last-drum')).toHaveTextContent('left');
    });

    it('adds remark to state for specific launch', () => {
        renderWithProviders(1);

        const pastLaunches: LaunchResponse[] = [
            {
                id: 99,
                launch_number: 1,
                timestamp: '2026-09-16T09:00:00Z',
                drum: 'left',
                operator_sn: 'OP1',
                squadron_id: '621 VGS',
                winch_id: 1,
                cable_id: null,
                created_at: '2026-09-16T09:00:00Z',
                day: '2026-09-16',
                remark: null,
            },
        ];

        act(() => {
            opsContext!.hydrateHistory(pastLaunches);
        });

        act(() => {
            opsContext!.addRemarkToState('left', 99, 'Glider aborted on ground');
        });

        expect(opsContext?.leftHistory[0].remark).toBe('Glider aborted on ground');
    });
});
