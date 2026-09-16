import React, {useEffect} from 'react';
import {act, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useDayOps} from './useDayOps';
import {DayOpsProvider} from '../providers/DayOpsProvider';
import {SessionIdentityProvider} from '../../../app/providers/SessionIdentityProvider';
import {postDayLogToDb} from '../api/dayOpsClient';

vi.mock('../api/dayOpsClient', () => ({
    postDayLogToDb: vi.fn(),
}));

let dayOpsContext: ReturnType<typeof useDayOps> | null = null;

const ConsumerComponent: React.FC = () => {
    const context = useDayOps();
    useEffect(() => {
        dayOpsContext = context;
    });
    return (
        <div>
            <span data-testid="day-finished">{context.dayFinished ? 'yes' : 'no'}</span>
            <span data-testid="signed-on">{context.signedOn ? 'yes' : 'no'}</span>
            <span data-testid="di-completed">{context.diCompleted ? 'yes' : 'no'}</span>
        </div>
    );
};

const getDayContext = (): ReturnType<typeof useDayOps> => {
    if (!dayOpsContext) throw new Error('dayOpsContext not initialized');
    return dayOpsContext;
};

const renderWithProviders = (
    winchId: number | null = 1,
    operatorSn: string = 'OP-1234',
    onDayFinished?: () => void
) => {
    dayOpsContext = null;
    return render(
        <SessionIdentityProvider squadronId="621 VGS" operatorSn={operatorSn} winchId={winchId}>
            <DayOpsProvider onDayFinished={onDayFinished}>
                <ConsumerComponent/>
            </DayOpsProvider>
        </SessionIdentityProvider>
    );
};

describe('useDayOps', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        dayOpsContext = null;
    });

    it('throws error when used outside DayOpsProvider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        });
        expect(() => render(<ConsumerComponent/>)).toThrow('useDayOps must be used within DayOpsProvider');
        consoleSpy.mockRestore();
    });

    it('initializes with default values', () => {
        renderWithProviders();
        expect(screen.getByTestId('day-finished')).toHaveTextContent('no');
        expect(screen.getByTestId('signed-on')).toHaveTextContent('no');
        expect(screen.getByTestId('di-completed')).toHaveTextContent('no');
    });

    it('handles finishDay successfully and invokes onDayFinished callback', async () => {
        const onDayFinished = vi.fn();
        vi.mocked(postDayLogToDb).mockResolvedValue({
            id: 1,
            squadron_id: '621 VGS',
            winch_id: 1,
            operator_sn: 'OP-1234',
            trainee: null,
            type: 'finish_day',
            cable_check: 'OK',
            hours: null,
            timestamp: '2026-09-16T10:00:00Z',
        });

        renderWithProviders(1, 'OP-1234', onDayFinished);

        await act(async () => {
            await getDayContext().finishDay('OK');
        });

        expect(postDayLogToDb).toHaveBeenCalled();
        expect(onDayFinished).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('day-finished')).toHaveTextContent('yes');
    });

    it('handles recordSignOn successfully', async () => {
        vi.mocked(postDayLogToDb).mockResolvedValue({
            id: 2,
            squadron_id: '621 VGS',
            winch_id: 1,
            operator_sn: 'OP-1234',
            trainee: 'TR-1',
            type: 'sign_on',
            cable_check: null,
            hours: null,
            timestamp: '2026-09-16T10:00:00Z',
        });

        renderWithProviders();

        await act(async () => {
            await getDayContext().recordSignOn('TR-1');
        });

        expect(postDayLogToDb).toHaveBeenCalled();
        expect(screen.getByTestId('signed-on')).toHaveTextContent('yes');
    });

    it('handles recordDI successfully', async () => {
        vi.mocked(postDayLogToDb).mockResolvedValue({
            id: 3,
            squadron_id: '621 VGS',
            winch_id: 1,
            operator_sn: 'OP-1234',
            trainee: null,
            type: 'di',
            cable_check: 'Pass',
            hours: 120,
            timestamp: '2026-09-16T10:00:00Z',
        });

        renderWithProviders();

        await act(async () => {
            await getDayContext().recordDI('Pass', 120);
        });

        expect(postDayLogToDb).toHaveBeenCalled();
        expect(screen.getByTestId('di-completed')).toHaveTextContent('yes');
    });

    it('throws when session identity is missing', async () => {
        renderWithProviders(null);
        await expect(getDayContext().finishDay()).rejects.toThrow('Incomplete session identity');
    });

    it('resets day state on resetDay', async () => {
        renderWithProviders();
        act(() => {
            getDayContext().resetDay();
        });
        expect(screen.getByTestId('day-finished')).toHaveTextContent('no');
    });
});
