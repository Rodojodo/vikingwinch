import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {WinchTab} from './WinchTab.tsx';

import { getDayLog } from "../features/day-ops/api/dayOpsClient.ts";
import { getLaunches } from "../features/launch-ops/api/launchClient.ts";
import { getOperatorsForSquadron } from "../core/http/operatorsClient.ts";


vi.mock('../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('../features/trainee-ops/hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));
vi.mock('../features/launch-ops/hooks/useLaunchOps.tsx', () => ({
    useLaunchOps: vi.fn(() => ({ 
        derived: { leftLastRecord: {}, rightLastRecord: {} }, 
        leftHistory: [], 
        rightHistory: [], 
        executeLaunch: vi.fn().mockResolvedValue(undefined), 
        undoLaunch: vi.fn().mockResolvedValue(undefined), 
        addRemarkToState: vi.fn() 
    }))
}));
vi.mock('../features/day-ops/hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));


vi.mock("../features/day-ops/api/dayOpsClient.ts", () => ({ getDayLog: vi.fn() }));
vi.mock("../features/launch-ops/api/launchClient.ts", () => ({ getLaunches: vi.fn() }));
vi.mock("../core/http/operatorsClient.ts", () => ({ getOperatorsForSquadron: vi.fn() }));



vi.mock('../features/winch-ops/api/dataClient', () => ({
    getDayLog: vi.fn(),
    getLaunches: vi.fn(),
    getOperatorsForSquadron: vi.fn(),
}));

vi.mock('../features/launch-ops/components/LaunchPanel', () => ({
    LaunchPanel: ({ onViewSkylogValues }: any) => (
        <div data-testid="launch-panel">
            <button onClick={onViewSkylogValues}>Go to Skylog</button>
        </div>
    ),
}));

vi.mock('../features/day-ops/components/SkylogValues', () => ({
    SkylogValues: ({ onBack }: any) => (
        <div data-testid="skylog-values">
            <button onClick={onBack}>Go back</button>
        </div>
    ),
}));

vi.mock('../features/winch-ops/components/WinchSelectPanel', () => ({
    WinchSelectPanel: ({onSelectWinch}: any) => (
        <div data-testid="winch-select">
            <button onClick={() => onSelectWinch(1)}>Select Winch</button>
        </div>
    ),
}));

describe('WinchTab', () => {
    it('renders LaunchPanel initially and toggles to SkylogValues', async () => {
        

        vi.mocked(getDayLog).mockResolvedValue([
            { id: 1, type: 'di', operator_sn: 'OFF-1001', squadron_id: 'sqn1', winch_id: 1, cable_check: 'OFF-1001', hours: 0, trainee: null, timestamp: null },
            { id: 2, type: 'sign_on', operator_sn: 'OFF-1001', squadron_id: 'sqn1', winch_id: 1, cable_check: 'OFF-1001', hours: 0, trainee: null, timestamp: null }
        ]);
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([]);
        vi.mocked(getLaunches).mockResolvedValue([]);

        render(<WinchTab tabId="1" squadronId="123 VGS" operatorSn="OFF-1001" winchId={1} openWinchIds={[]} onWinchSelect={vi.fn()} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText('Go to Skylog'));
        
        expect(screen.getByTestId('skylog-values')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Go back'));
        
        expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
    });

    it('renders WinchSelectPanel initially if winchId is null', () => {
        const setWinchIdMock = vi.fn();
        

        render(<WinchTab tabId="1" squadronId="123 VGS" operatorSn="OFF-1001" winchId={null} openWinchIds={[]} onWinchSelect={vi.fn()} />);
        
        expect(screen.getByTestId('winch-select')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Select Winch'));
        
        expect(setWinchIdMock).toHaveBeenCalledWith(1);
    });
});
