import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WinchTab } from './WinchTab.tsx';
import { getDayLog, postDayLogToDb } from '../features/day-ops/api/dayOpsClient.ts';
import { getLaunches, postLaunchCorrections } from '../features/launch-ops/api/launchClient.ts';
import { getOperatorsForSquadron } from '../core/http/operatorsClient.ts';
import { exportLog } from '../app/utils/exportLog.ts';

vi.mock('../features/day-ops/api/dayOpsClient.ts', () => ({
    getDayLog: vi.fn(),
    postDayLogToDb: vi.fn().mockResolvedValue({}),
}));
vi.mock('../features/launch-ops/api/launchClient.ts', () => ({
    getLaunches: vi.fn(),
    postLaunchCorrections: vi.fn().mockResolvedValue([]),
}));
vi.mock('../core/http/operatorsClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));
vi.mock('../app/utils/exportLog.ts', () => ({
    exportLog: vi.fn(),
}));

vi.mock('../features/launch-ops/components/LaunchPanel', () => ({
    LaunchPanel: ({ children }: { children?: React.ReactNode }) => <div data-testid="launch-panel">{children}</div>,
}));
vi.mock('../features/winch-ops/components/DailyInspectionPanel', () => ({
    DailyInspectionPanel: ({
        onSubmitCorrections,
    }: {
        onSubmitCorrections?: (corrections: { left: number | null; right: number | null }) => Promise<unknown>;
    }) => (
        <div data-testid="daily-inspection-panel">
            <button onClick={() => onSubmitCorrections?.({ left: 20, right: null })}>Submit Test Corrections</button>
        </div>
    ),
}));
vi.mock('../features/day-ops/components/SignOnPanel.tsx', () => ({
    SignOnPanel: () => <div data-testid="sign-on-panel" />,
}));
vi.mock('../features/winch-ops/components/WinchSelectPanel', () => ({
    WinchSelectPanel: ({ onSelectWinch }: { onSelectWinch: (winchId: number) => void }) => (
        <div data-testid="winch-select">
            <button onClick={() => onSelectWinch(1)}>Select Winch</button>
        </div>
    ),
}));
vi.mock('../features/trainee-ops/components/TraineeWing.tsx', () => ({
    TraineeWing: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="trainee-wing">{children}</div>
    ),
}));
vi.mock('../features/trainee-ops/components/TraineeAssignmentPanel.tsx', () => ({
    TraineeAssignmentPanel: ({ recordSignOn }: { recordSignOn: (trainee: string | null) => Promise<unknown> }) => (
        <div data-testid="trainee-assignment-panel">
            <button onClick={() => recordSignOn('NEW-TRAINEE')}>Assign Trainee</button>
        </div>
    ),
}));
vi.mock('../features/day-ops/components/SkylogValues', () => ({
    SkylogValues: ({ onBack }: { onBack: () => void }) => (
        <div data-testid="skylog-values">
            <button onClick={onBack}>Back to Launch</button>
        </div>
    ),
}));
vi.mock('../features/remarks-repairs/components/RemarksRepairsPanel.tsx', () => ({
    RemarksRepairsPanel: () => <div data-testid="remarks-repairs-panel" /> as React.ReactElement,
}));
vi.mock('../features/day-ops/components/FinishDayPanel.tsx', () => ({
    FinishDayPanel: ({ onExportLog }: { onExportLog?: () => void }) => (
        <div data-testid="finish-day-panel">
            <button onClick={onExportLog}>Export Log</button>
        </div>
    ),
}));

describe('WinchTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([]);
    });

    it('renders WinchSelectPanel initially if winchId is null', async () => {
        const onWinchSelectMock = vi.fn();

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={null}
                openWinchIds={[]}
                onWinchSelect={onWinchSelectMock}
            />
        );

        expect(screen.getByTestId('winch-select')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByText('Select Winch'));
        });

        expect(onWinchSelectMock).toHaveBeenCalledWith('1', 1);
    });

    it('renders DailyInspectionPanel when no DI exists today', async () => {
        vi.mocked(getDayLog).mockResolvedValue([]);
        vi.mocked(getLaunches).mockResolvedValue([]);

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={1}
                openWinchIds={[]}
                onWinchSelect={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('daily-inspection-panel')).toBeInTheDocument();
        });
    });

    it('passes onSubmitCorrections to DailyInspectionPanel which calls postLaunchCorrections and hydrates history', async () => {
        vi.mocked(getDayLog).mockResolvedValue([]);
        vi.mocked(getLaunches).mockResolvedValue([]);
        const mockCorrectionsResponse = [
            {
                launch_id: 101,
                launch_number: 20,
                squadron_id: '123 VGS',
                winch_id: 1,
                drum: 'left' as const,
                timestamp: '2026-09-16T00:00:00Z',
                operator_sn: 'OFF-1001',
                remarks: 'corrected brought forward',
            },
        ];
        vi.mocked(postLaunchCorrections).mockResolvedValue(mockCorrectionsResponse);

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={1}
                openWinchIds={[]}
                onWinchSelect={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('daily-inspection-panel')).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Submit Test Corrections'));
        });

        expect(postLaunchCorrections).toHaveBeenCalledWith({
            winch_id: 1,
            squadron_id: '123 VGS',
            operator_sn: 'OFF-1001',
            left: 20,
            right: null,
        });
    });

    it('renders SignOnPanel when DI exists but operator is not signed on', async () => {
        vi.mocked(getDayLog).mockResolvedValue([
            {
                id: 1,
                type: 'di',
                operator_sn: 'OTHER-OP',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OTHER-OP',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
        ]);
        vi.mocked(getLaunches).mockResolvedValue([]);

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={1}
                openWinchIds={[]}
                onWinchSelect={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('sign-on-panel')).toBeInTheDocument();
        });
    });

    it('renders LaunchPanel when inspection and sign-on exist for today and exports log', async () => {
        vi.mocked(getDayLog).mockResolvedValue([
            {
                id: 1,
                type: 'di',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
            {
                id: 2,
                type: 'sign_on',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
        ]);
        vi.mocked(getLaunches).mockResolvedValue([]);

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={1}
                openWinchIds={[]}
                onWinchSelect={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Export Log'));
        expect(exportLog).toHaveBeenCalledWith(expect.objectContaining({
            dayFinished: false,
            winchId: 1,
        }));
    });

    it('detects finished day and passes dayFinished: true to exportLog', async () => {
        vi.mocked(getDayLog).mockResolvedValue([
            {
                id: 1,
                type: 'di',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
            {
                id: 2,
                type: 'sign_on',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
            {
                id: 3,
                type: 'finish_day',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 10,
                trainee: null,
                timestamp: '2026-09-16T18:00:00Z',
                day: '2026-09-16',
            },
        ]);
        vi.mocked(getLaunches).mockResolvedValue([]);

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={1}
                openWinchIds={[]}
                onWinchSelect={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Export Log'));
        expect(exportLog).toHaveBeenCalledWith(expect.objectContaining({
            dayFinished: true,
            winchId: 1,
        }));
    });

    it('navigates to SkylogValues when "Show skylog values" is clicked and returns to launch on back', async () => {
        vi.mocked(getDayLog).mockResolvedValue([
            {
                id: 1,
                type: 'di',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
            {
                id: 2,
                type: 'sign_on',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
        ]);
        vi.mocked(getLaunches).mockResolvedValue([]);

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={1}
                openWinchIds={[]}
                onWinchSelect={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
        });

        const skylogBtn = screen.getByText('Show skylog values');
        expect(skylogBtn).toBeInTheDocument();

        fireEvent.click(skylogBtn);

        await waitFor(() => {
            expect(screen.getByTestId('skylog-values')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Back to Launch'));

        await waitFor(() => {
            expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
        });
    });

    it('renders TraineeAssignmentPanel in TraineeWing and handles trainee sign-on', async () => {
        vi.mocked(getDayLog).mockResolvedValue([
            {
                id: 1,
                type: 'di',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
            {
                id: 2,
                type: 'sign_on',
                operator_sn: 'OFF-1001',
                squadron_id: '123 VGS',
                winch_id: 1,
                cable_check: 'OFF-1001',
                hours: 0,
                trainee: null,
                timestamp: '2026-09-16T00:00:00Z',
                day: '2026-09-16',
            },
        ]);
        vi.mocked(getLaunches).mockResolvedValue([]);

        render(
            <WinchTab
                tabId="1"
                squadronId="123 VGS"
                operatorSn="OFF-1001"
                winchId={1}
                openWinchIds={[]}
                onWinchSelect={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('trainee-wing')).toBeInTheDocument();
            expect(screen.getByTestId('trainee-assignment-panel')).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Assign Trainee'));
        });

        expect(postDayLogToDb).toHaveBeenCalledWith(expect.objectContaining({
            squadron_id: '123 VGS',
            winch_id: 1,
            operator_sn: 'OFF-1001',
            trainee: 'NEW-TRAINEE',
            type: 'sign_on',
        }));
    });
});
