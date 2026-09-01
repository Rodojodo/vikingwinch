import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DrumToggleGroup } from './DrumToggleGroup.tsx';

describe('DrumToggleGroup', () => {
    it('renders left and right drum buttons', () => {
        render(<DrumToggleGroup value="left" onChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: /Left drum/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Right drum/i })).toBeInTheDocument();
    });

    it('calls onChange when left drum is clicked', () => {
        const handleChange = vi.fn();
        render(<DrumToggleGroup value="right" onChange={handleChange} />);
        fireEvent.click(screen.getByRole('button', { name: /Left drum/i }));
        expect(handleChange).toHaveBeenCalledWith('left');
    });

    it('calls onChange when right drum is clicked', () => {
        const handleChange = vi.fn();
        render(<DrumToggleGroup value="left" onChange={handleChange} />);
        fireEvent.click(screen.getByRole('button', { name: /Right drum/i }));
        expect(handleChange).toHaveBeenCalledWith('right');
    });
});
