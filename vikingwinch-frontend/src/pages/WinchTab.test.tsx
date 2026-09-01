import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WinchTab } from './WinchTab.tsx';
import { useWinchSession } from '../features/winch-ops/hooks/useWinchSession';

vi.mock('../features/winch-ops/hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(),
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

describe('WinchTab', () => {
    it('renders LaunchPanel initially and toggles to SkylogValues', () => {
        vi.mocked(useWinchSession).mockReturnValue({
            state: { winchId: 1, squadron: 'sqn1' },
            derived: { leftLaunches: 10, rightLaunches: 15 }
        } as any);

        render(<WinchTab />);
        
        expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Go to Skylog'));
        
        expect(screen.getByTestId('skylog-values')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Go back'));
        
        expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
    });
});
