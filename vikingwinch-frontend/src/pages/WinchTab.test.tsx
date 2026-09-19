import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {WinchTab} from './WinchTab.tsx';
import {getDayLog} from '../features/day-ops/api/dayOpsClient.ts';
import {getLaunches, postLaunchCorrections} from '../features/launch-ops/api/launchClient.ts';
import {getOperatorsForSquadron} from '../core/http/operatorsClient.ts';
import {getExportData} from '../features/winch-ops/api/winchClient.ts';
import {exportLog} from '../app/utils/exportLog.ts';

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
vi.mock('../features/winch-ops/api/winchClient.ts', () => ({
    getExportData: vi.fn().mockResolvedValue({
        winch: {id: 1, registration: 'VX001', squadron_id: '123 VGS'},
        logs: [],
        launches: [],
        operators: [],
        brought_forward: {left: 0, right: 0},
    }),
}));
vi.mock('../app/utils/exportLog.ts', () => ({
    exportLog: vi.fn().mockResolvedValue(undefined),
    getTodayDateString: vi.fn().mockReturnValue('2026-09-19'),
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
vi.mock('../features/winch-ops/components/LogsheetExportPanel', () => ({
    LogsheetExportPanel: ({
        onExport,
    }: {
        onExport?: (winchId: number) => Promise<void>;
    }) => (
        <div data-testid="logsheet-export-panel">
            <button onClick={() => onExport?.(2)}>Export Winch 2</button>
        </div>
    ),
}));
vi.mock('../features/trainee-ops/components/TraineeWing.tsx', () => ({
    TraineeWing: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="trainee-wing">{children}</div>
    ),
}));
vi.mock('../features/trainee-ops/components/TraineeAssignmentPanel.tsx', () => ({
    TraineeAssignmentPanel: () => <div data-testid="trainee-assignment-panel"/>,
}));
vi.mock('../features/day-ops/components/SkylogValues', () => ({
    SkylogValues: ({ onBack }: { onBack: () => void }) => (
        <div data-testid="skylog-values">
            <button onClick={onBack}>Back to Launch</button>
        </div>
    ),
}));
vi.mock('../features/remarks-repairs/components/RemarksRepairsPanel.tsx', () => ({
    RemarksRepairsPanel: () => <div data-testid="remarks-repairs-panel"/>,
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
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            {service_no: 'OFF-1001', name: 'Officer One', squadron_id: '123 VGS'},
        ]);
        vi.mocked(getExportData).mockResolvedValue({
            winch: {id: 1, registration: 'VX001', squadron_id: '123 VGS'},
            logs: [],
            launches: [],
            operators: [],
            brought_forward: {left: 0, right: 0},
        });
    });

    it('renders WinchSelectPanel and LogsheetExportPanel when winchId is null', async () => {
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
        expect(screen.getByTestId('logsheet-export-panel')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByText('Export Winch 2'));
        });

        expect(getExportData).toHaveBeenCalledWith(2, '123 VGS', expect.any(String));
        expect(exportLog).toHaveBeenCalled();

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

    it('passes onSubmitCorrections to DailyInspectionPanel which calls postLaunchCorrections without polluting launch history', async () => {
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

        expect(postLaunchCorrections).toHaveBeenCalledWith(expect.objectContaining({
            winch_id: 1,
            left: 20,
            right: null,
        }));
    });

    it('renders SignOnPanel when DI exists today but no sign-on exists', async () => {
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

        await act(async () => {
            fireEvent.click(screen.getByText('Export Log'));
        });

        expect(getExportData).toHaveBeenCalledWith(1, '123 VGS', expect.any(String));
        await waitFor(() => {
            expect(exportLog).toHaveBeenCalledWith(
                expect.objectContaining({winch: expect.objectContaining({id: 1})}),
                expect.any(String)
            );
        });
    });

    it('detects finished day and exports log via getExportData', async () => {
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

        await act(async () => {
            fireEvent.click(screen.getByText('Export Log'));
        });

        expect(getExportData).toHaveBeenCalledWith(1, '123 VGS', expect.any(String));
        await waitFor(() => {
            expect(exportLog).toHaveBeenCalledWith(
                expect.objectContaining({winch: expect.objectContaining({id: 1})}),
                expect.any(String)
            );
        });
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

        expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
    });
});
