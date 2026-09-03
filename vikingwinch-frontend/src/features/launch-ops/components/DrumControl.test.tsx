import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DrumControl } from './DrumControl.tsx';

describe('DrumControl', () => {
    const mockOnLaunch = vi.fn();
    const mockOnBurn = vi.fn();
    const mockOnUndo = vi.fn();

    const defaultProps = {
        drumType: 'left' as const,
        launches: 5,
        isLoading: false,
        isUsed: false,
        isResetting: false,
        currentAnim: 'none',
        onLaunch: mockOnLaunch,
        onBurn: mockOnBurn,
        onUndo: mockOnUndo,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly for left drum', () => {
        render(<DrumControl {...defaultProps} drumType="left" />);
        expect(screen.getByText('Left Drum')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Burn Left/i })).toBeInTheDocument();
        expect(screen.getByText('− Undo Left')).toBeInTheDocument();
        expect(screen.getByText('5 launches')).toBeInTheDocument();
        expect(screen.getByText('5 recorded')).toBeInTheDocument();
    });

    it('renders correctly for right drum', () => {
        render(<DrumControl {...defaultProps} drumType="right" launches={2} />);
        expect(screen.getByText('Right Drum')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Burn Right/i })).toBeInTheDocument();
        expect(screen.getByText('− Undo Right')).toBeInTheDocument();
        expect(screen.getByText('2 launches')).toBeInTheDocument();
        expect(screen.getByText('2 recorded')).toBeInTheDocument();
    });

    it('renders placeholder text when launches is 0', () => {
        render(<DrumControl {...defaultProps} launches={0} />);
        expect(screen.getByText('Not yet launched')).toBeInTheDocument();
        // Undo should be disabled when there are 0 launches
        expect(screen.getByText('− Undo Left').closest('button')).toBeDisabled();
    });

    it('triggers onLaunch when main button is clicked', () => {
        render(<DrumControl {...defaultProps} />);
        const launchBtn = screen.getByText('Left Drum').closest('button');
        fireEvent.click(launchBtn!);
        expect(mockOnLaunch).toHaveBeenCalledTimes(1);
    });

    it('triggers onBurn when burn button is clicked', () => {
        render(<DrumControl {...defaultProps} />);
        const burnBtn = screen.getByRole('button', { name: /Burn Left/i });
        fireEvent.click(burnBtn!);
        expect(mockOnBurn).toHaveBeenCalledTimes(1);
    });

    it('triggers onUndo when undo button is clicked', () => {
        render(<DrumControl {...defaultProps} />);
        const undoBtn = screen.getByText('− Undo Left').closest('button');
        fireEvent.click(undoBtn!);
        expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it('disables launch and burn buttons when isLoading is true', () => {
        render(<DrumControl {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Left Drum').closest('button')).toBeDisabled();
        expect(screen.getByRole('button', { name: /Burn Left/i })).toBeDisabled();
        expect(screen.getByText('− Undo Left').closest('button')).toBeDisabled();
    });

    it('disables launch and burn buttons when isUsed is true', () => {
        render(<DrumControl {...defaultProps} isUsed={true} />);
        expect(screen.getByText('Left Drum').closest('button')).toBeDisabled();
        expect(screen.getByRole('button', { name: /Burn Left/i })).toBeDisabled();
        // Undo shouldn't be disabled by isUsed, only by isLoading or launches === 0
        expect(screen.getByText('− Undo Left').closest('button')).not.toBeDisabled();
    });

    it('disables launch and burn buttons when isResetting is true', () => {
        render(<DrumControl {...defaultProps} isResetting={true} />);
        expect(screen.getByText('Left Drum').closest('button')).toBeDisabled();
        expect(screen.getByRole('button', { name: /Burn Left/i })).toBeDisabled();
    });

    it('applies animation styles and combination of used/resetting correctly', () => {
        const { rerender } = render(<DrumControl {...defaultProps} currentAnim="animFadeScale 0.6s" />);
        expect(screen.getByText('Left Drum')).toBeInTheDocument();
        
        rerender(<DrumControl {...defaultProps} isResetting={true} isUsed={true} />);
        expect(screen.getByText('Left Drum')).toBeInTheDocument();

        rerender(<DrumControl {...defaultProps} isUsed={true} isResetting={false} />);
        expect(screen.getByText('Left Drum')).toBeInTheDocument();
    });
});