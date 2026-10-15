import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StarsStatusGraphic } from './StarsStatusGraphic';
import type { OperatorQualificationsRead } from '../types';

describe('StarsStatusGraphic', () => {
    const baseQuals: OperatorQualificationsRead = {
        service_no: 'OP-1234',
        stars_resource_id: 'RES-1',
        c005_operator: 'green',
        c005_expiry: null,
        e004_instructor: 'nil',
        e004_expiry: null,
        c003_examiner: 'nil',
        c003_expiry: null,
        rolling_currency: 'nil',
        rolling_expiry: null,
        is_stale: false,
        last_checked_at: '2026-10-15T12:00:00Z',
    };

    it('renders qualification badges with emoticons and status labels', () => {
        const quals: OperatorQualificationsRead = {
            ...baseQuals,
            c005_operator: 'green',
            e004_instructor: 'amber',
            c003_examiner: 'blue',
        };

        render(<StarsStatusGraphic qualifications={quals} />);

        // Operator C005 with 🚜
        expect(screen.getByText(/🚜/)).toBeDefined();
        expect(screen.getByText(/Operator/i)).toBeDefined();
        expect(screen.getByText(/green/i)).toBeDefined();

        // Instructor E004 with 🎓
        expect(screen.getByText(/🎓/)).toBeDefined();
        expect(screen.getByText(/Instructor/i)).toBeDefined();
        expect(screen.getByText(/amber/i)).toBeDefined();

        // Examiner C003 with 🧐
        expect(screen.getByText(/🧐/)).toBeDefined();
        expect(screen.getByText(/Examiner/i)).toBeDefined();
        expect(screen.getByText(/blue/i)).toBeDefined();
    });

    it('omits qualifications with nil status', () => {
        const quals: OperatorQualificationsRead = {
            ...baseQuals,
            c005_operator: 'green',
            e004_instructor: 'nil',
            c003_examiner: 'nil',
            rolling_currency: 'nil',
        };

        render(<StarsStatusGraphic qualifications={quals} />);

        expect(screen.getByText(/🚜/)).toBeDefined();
        expect(screen.queryByText(/🎓/)).toBeNull();
        expect(screen.queryByText(/🧐/)).toBeNull();
    });

    it('renders refresh button and calls onRefresh when clicked', () => {
        const onRefresh = vi.fn();
        render(<StarsStatusGraphic qualifications={baseQuals} onRefresh={onRefresh} isRefreshing={false} />);

        const refreshButton = screen.getByRole('button', { name: /Refresh status/i });
        fireEvent.click(refreshButton);

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('disables refresh button when isRefreshing is true', () => {
        render(<StarsStatusGraphic qualifications={baseQuals} onRefresh={vi.fn()} isRefreshing={true} />);

        const refreshButton = screen.getByRole('button', { name: /Refresh status/i });
        expect(refreshButton).toHaveProperty('disabled', true);
    });

    it('handles null qualifications gracefully', () => {
        render(<StarsStatusGraphic qualifications={null} />);
        expect(screen.getByText(/STARS Qualifications/i)).toBeDefined();
    });
});
