import React, { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTraineeOps } from './useTraineeOps';
import { TraineeOpsProvider } from '../providers/TraineeOpsProvider';
import { SessionIdentityProvider } from '../../../app/providers/SessionIdentityProvider';

const ConsumerComponent: React.FC<{
    onReady?: (ops: ReturnType<typeof useTraineeOps>) => void;
}> = ({ onReady }) => {
    const ops = useTraineeOps();
    useEffect(() => {
        if (onReady) onReady(ops);
    });
    return (
        <div>
            <span data-testid="trainee-sn">{ops.traineeSn ?? 'none'}</span>
            <span data-testid="active-launcher">{ops.activeLauncherSn ?? 'none'}</span>
            <button onClick={() => ops.setTrainee('TR-100')}>Set Trainee</button>
            <button onClick={() => ops.setTrainee(null)}>Clear Trainee</button>
            <button onClick={() => ops.setActiveLauncher('TR-100')}>Set Active Trainee</button>
        </div>
    );
};

describe('useTraineeOps', () => {
    it('throws error when used outside TraineeOpsProvider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            render(<ConsumerComponent />);
        }).toThrow('useTraineeOps must be used within TraineeOpsProvider');

        consoleSpy.mockRestore();
    });

    it('defaults activeLauncherSn to operatorSn from session identity', async () => {
        render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={1}>
                <TraineeOpsProvider>
                    <ConsumerComponent />
                </TraineeOpsProvider>
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('trainee-sn')).toHaveTextContent('none');
        expect(screen.getByTestId('active-launcher')).toHaveTextContent('OP-1234');
    });

    it('updates trainee and resets active launcher on setTrainee', () => {
        render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={1}>
                <TraineeOpsProvider>
                    <ConsumerComponent />
                </TraineeOpsProvider>
            </SessionIdentityProvider>
        );

        act(() => {
            screen.getByText('Set Trainee').click();
        });

        expect(screen.getByTestId('trainee-sn')).toHaveTextContent('TR-100');
        expect(screen.getByTestId('active-launcher')).toHaveTextContent('OP-1234');
    });

    it('allows switching active launcher and clearing trainee', () => {
        render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={1}>
                <TraineeOpsProvider>
                    <ConsumerComponent />
                </TraineeOpsProvider>
            </SessionIdentityProvider>
        );

        act(() => {
            screen.getByText('Set Trainee').click();
        });
        act(() => {
            screen.getByText('Set Active Trainee').click();
        });

        expect(screen.getByTestId('active-launcher')).toHaveTextContent('TR-100');

        act(() => {
            screen.getByText('Clear Trainee').click();
        });

        expect(screen.getByTestId('trainee-sn')).toHaveTextContent('none');
        expect(screen.getByTestId('active-launcher')).toHaveTextContent('OP-1234');
    });
});
