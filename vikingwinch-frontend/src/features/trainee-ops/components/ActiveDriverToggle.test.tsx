import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActiveDriverToggle } from './ActiveDriverToggle';

describe('ActiveDriverToggle', () => {
    it('returns null if traineeSn is null or empty', () => {
        const { container } = render(
            <ActiveDriverToggle
                operatorSn="OP-1"
                operatorName="Alice"
                traineeSn={null}
                value="OP-1"
                onChange={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders operator and trainee buttons when trainee is present', () => {
        render(
            <ActiveDriverToggle
                operatorSn="OP-1"
                operatorName="Alice"
                traineeSn="TR-1"
                traineeName="Bob"
                value="OP-1"
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Active driver')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Bob' })).toBeInTheDocument();
    });

    it('falls back to "Trainee" if traineeName is not provided', () => {
        render(
            <ActiveDriverToggle
                operatorSn="OP-1"
                operatorName="Alice"
                traineeSn="TR-1"
                value="OP-1"
                onChange={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Trainee' })).toBeInTheDocument();
    });

    it('calls onChange with the clicked service number', () => {
        const onChange = vi.fn();
        render(
            <ActiveDriverToggle
                operatorSn="OP-1"
                operatorName="Alice"
                traineeSn="TR-1"
                traineeName="Bob"
                value="OP-1"
                onChange={onChange}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Bob' }));
        expect(onChange).toHaveBeenCalledWith('TR-1');
    });

    it('does not trigger onChange when clicking already selected button (next is null)', () => {
        const onChange = vi.fn();
        render(
            <ActiveDriverToggle
                operatorSn="OP-1"
                operatorName="Alice"
                traineeSn="TR-1"
                traineeName="Bob"
                value="OP-1"
                onChange={onChange}
            />
        );

        // Clicking the currently active button in an exclusive ToggleButtonGroup toggles it off, passing null
        fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
        expect(onChange).not.toHaveBeenCalled();
    });
});
