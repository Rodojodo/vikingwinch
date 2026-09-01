import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WinchTab from './WinchTab';
import { useWinchSession } from '../hooks/useWinchSession';

vi.mock('../hooks/useWinchSession', () => ({
    useWinchSession: vi.fn(),
}));

vi.mock('../components/LaunchPanel', () => ({
    LaunchPanel: ({ onViewSkylogValues }: any) => (
        <div data-testid="launch-panel">
            <button onClick={onViewSkylogValues}>Go to Skylog</button>
        </div>
    ),
}));

vi.mock('../components/SkylogValues', () => ({
    SkylogValues: ({ onBack }: any) => (
        <div data-testid="skylog-values">
            <button onClick={onBack}>Go back</button>
        </div>
    ),
}));

describe('WinchTab', () => {
    it('renders LaunchPanel initially and toggles to SkylogValues', () => {
        vi.mocked(useWinchSession).mockReturnValue({} as any);

        render(<WinchTab />);
        
        expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Go to Skylog'));
        
        expect(screen.getByTestId('skylog-values')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Go back'));
        
        expect(screen.getByTestId('launch-panel')).toBeInTheDocument();
    });
});
