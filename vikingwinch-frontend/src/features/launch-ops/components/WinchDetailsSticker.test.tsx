import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WinchDetailsSticker } from './WinchDetailsSticker.tsx';

describe('WinchDetailsSticker', () => {
    it('renders correctly for recent launch', () => {
        render(<WinchDetailsSticker isRecentLaunch={true} squadron="Squadron 1" winchId={42} />);
        
        expect(screen.getByText("Don't turn off winch")).toBeInTheDocument();
        expect(screen.getByText("Squadron 1:")).toBeInTheDocument();
        expect(screen.getByText("Winch 42")).toBeInTheDocument();
    });

    it('renders correctly for non-recent launch', () => {
        render(<WinchDetailsSticker isRecentLaunch={false} squadron="Squadron 2" winchId={10} />);
        
        expect(screen.getByText("Turn off winch")).toBeInTheDocument();
        expect(screen.getByText("Squadron 2:")).toBeInTheDocument();
        expect(screen.getByText("Winch 10")).toBeInTheDocument();
    });
});
