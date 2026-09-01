import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SkylogValues from './SkylogValues';

describe('SkylogValues', () => {
    it('renders and calls onBack correctly', () => {
        const mockOnBack = vi.fn();
        const mockSession = {
            derived: { leftLaunches: 10, rightLaunches: 15 },
            state: { winchId: 1, squadron: 'sqn1' }
        } as any;

        render(<SkylogValues onBack={mockOnBack} session={mockSession} />);
        
        expect(screen.getByText('Winch 1 — sqn1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // left launches
        expect(screen.getByText('15')).toBeInTheDocument(); // right launches
        expect(screen.getByText('25')).toBeInTheDocument(); // winch total
        
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
});
