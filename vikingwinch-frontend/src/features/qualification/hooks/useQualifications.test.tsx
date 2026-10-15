import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQualifications } from './useQualifications';
import { getQualifications, refreshQualifications } from '../api/qualificationClient';
import { isValidQualification, type OperatorQualificationsRead } from '../types';

vi.mock('../api/qualificationClient', () => ({
    getQualifications: vi.fn(),
    refreshQualifications: vi.fn(),
}));

const mockQuals: OperatorQualificationsRead = {
    service_no: 'OP-1234',
    stars_resource_id: 'RES-1',
    c005_operator: 'green',
    c005_expiry: null,
    e004_instructor: 'amber',
    e004_expiry: null,
    c003_examiner: 'blue',
    c003_expiry: null,
    rolling_currency: 'green',
    rolling_expiry: null,
    is_stale: false,
    last_checked_at: '2026-10-15T12:00:00Z',
};

function TestComponent() {
    const { qualifications, isLoading, error, refresh } = useQualifications();
    return (
        <div>
            <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
            <div data-testid="error">{error || 'no-error'}</div>
            <div data-testid="operator">{qualifications?.c005_operator || 'none'}</div>
            <button onClick={() => refresh()}>Refresh</button>
        </div>
    );
}

describe('useQualifications & isValidQualification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('isValidQualification', () => {
        it('returns true for green and amber', () => {
            expect(isValidQualification('green')).toBe(true);
            expect(isValidQualification('amber')).toBe(true);
        });

        it('returns false for blue, red, nil, null, and undefined', () => {
            expect(isValidQualification('blue')).toBe(false);
            expect(isValidQualification('red')).toBe(false);
            expect(isValidQualification('nil')).toBe(false);
            expect(isValidQualification(null)).toBe(false);
            expect(isValidQualification(undefined)).toBe(false);
            expect(isValidQualification('')).toBe(false);
        });
    });

    describe('useQualifications hook', () => {
        it('loads qualifications on mount', async () => {
            vi.mocked(getQualifications).mockResolvedValue(mockQuals);

            render(<TestComponent />);

            expect(screen.getByTestId('loading').textContent).toBe('loading');

            await act(async () => {
                await Promise.resolve();
            });

            expect(screen.getByTestId('loading').textContent).toBe('not-loading');
            expect(screen.getByTestId('operator').textContent).toBe('green');
            expect(getQualifications).toHaveBeenCalledTimes(1);
        });

        it('handles fetch error gracefully', async () => {
            vi.mocked(getQualifications).mockRejectedValue(new Error('Failed to fetch'));

            render(<TestComponent />);

            await act(async () => {
                await Promise.resolve();
            });

            expect(screen.getByTestId('loading').textContent).toBe('not-loading');
            expect(screen.getByTestId('error').textContent).toBe('Failed to load qualifications');
        });

        it('refreshes qualifications when refresh is called', async () => {
            vi.mocked(getQualifications).mockResolvedValue(mockQuals);
            const refreshedQuals: OperatorQualificationsRead = {
                ...mockQuals,
                c005_operator: 'amber',
            };
            vi.mocked(refreshQualifications).mockResolvedValue(refreshedQuals);

            render(<TestComponent />);

            await act(async () => {
                await Promise.resolve();
            });

            expect(screen.getByTestId('operator').textContent).toBe('green');

            await act(async () => {
                screen.getByText('Refresh').click();
            });

            expect(refreshQualifications).toHaveBeenCalledTimes(1);
            expect(screen.getByTestId('operator').textContent).toBe('amber');
        });
    });
});
