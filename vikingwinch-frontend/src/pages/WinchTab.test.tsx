import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WinchTab } from './WinchTab.tsx';
import { getDayLog } from '../features/day-ops/api/dayOpsClient.ts';
import { getLaunches } from '../features/launch-ops/api/launchClient.ts';
import { getOperatorsForSquadron } from '../core/http/operatorsClient.ts';

vi.mock('../features/day-ops/api/dayOpsClient.ts', () => ({
    getDayLog: vi.fn(),
}));
vi.mock('../features/launch-ops/api/launchClient.ts', () => ({
    getLaunches: vi.fn(),
}));
vi.mock('../core/http/operatorsClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

vi.mock('../features/launch-ops/components/LaunchPanel', () => ({
    LaunchPanel: () => <div data-testid="launch-panel" />,
}));
vi.mock('../features/winch-ops/components/DailyInspectionPanel', () => ({
    DailyInspectionPanel: () => <div data-testid="daily-inspection-panel" />,
}));
vi.mock('../features/day-ops/components/SignOnPanel.tsx', () => ({
    SignOnPanel: () => <div data-testid="sign-on-panel" />,
}));
vi.mock('../features/winch-ops/components/WinchSelectPanel', () => ({
    WinchSelectPanel: ({ onSelectWinch }: any) => (
        <div data-testid="winch-select">
            <button onClick={() => onSelectWinch(1)}>Select Winch</button>
        </div>
    ),
}));
vi.mock('../features/trainee-ops/components/TraineeWing.tsx', () => ({
    TraineeWing: () => <div data-testid="trainee-wing" />,
}));
vi.mock('../features/remarks-repairs/components/RemarksRepairsPanel.tsx', () => ({
    RemarksRepairsPanel: () => <div data-testid="remarks-repairs-panel" />,
}));
vi.mock('../features/day-ops/components/FinishDayPanel.tsx', () => ({
    FinishDayPanel: () => <div data-testid="finish-day-panel" />,
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

    it('renders LaunchPanel when inspection and sign-on exist for today', async () => {
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
    });
});
