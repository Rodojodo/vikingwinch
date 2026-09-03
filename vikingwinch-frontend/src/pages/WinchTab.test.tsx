import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WinchTab } from './WinchTab.tsx';
import { useWinchSession } from '../features/winch-ops/hooks/useWinchSession';
import { getDayLog } from '../features/winch-ops/api/dataClient';

vi.mock('../features/winch-ops/hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(),
}));

vi.mock('../features/winch-ops/api/dataClient', () => ({
    getDayLog: vi.fn(),
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
    WinchSelectPanel: ({ onSelectWinch }: any) => (
        <div data-testid="winch-select">
            <button onClick={() => onSelectWinch(1)}>Select Winch</button>
        </div>
    ),
}));

describe('WinchTab', () => {
    it('renders LaunchPanel initially and toggles to SkylogValues', async () => {
        vi.mocked(useWinchSession).mockReturnValue({
            state: { winchId: 1, squadron: 'sqn1' },
            derived: { leftLaunches: 10, rightLaunches: 15 }
        } as any);

        vi.mocked(getDayLog).mockResolvedValue([
            { id: 1, type: 'di', operator_id: 'OFF-1001', squadron_id: 'sqn1', winch_id: 1, cable_check: 'OFF-1001', hours: 0, trainee: null, timestamp: null },
            { id: 2, type: 'sign_on', operator_id: 'OFF-1001', squadron_id: 'sqn1', winch_id: 1, cable_check: 'OFF-1001', hours: 0, trainee: null, timestamp: null }
        ]);

        render(<WinchTab tabId="1" squadronId="123 VGS" operatorSn="OFF-1001" winchId={1} onWinchSelect={vi.fn()} />);
        
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
        vi.mocked(useWinchSession).mockReturnValue({
            state: { winchId: null, squadron: 'sqn1' },
            setWinchId: setWinchIdMock,
            derived: { leftLaunches: 10, rightLaunches: 15 }
        } as any);

        render(<WinchTab tabId="1" squadronId="123 VGS" operatorSn="OFF-1001" winchId={null} onWinchSelect={vi.fn()} />);
        
        expect(screen.getByTestId('winch-select')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Select Winch'));
        
        expect(setWinchIdMock).toHaveBeenCalledWith(1);
    });
});
