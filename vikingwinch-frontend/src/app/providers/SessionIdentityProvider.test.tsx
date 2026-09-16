import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SessionIdentityProvider } from './SessionIdentityProvider';
import { useSessionIdentity } from '../hooks/useSessionIdentity';
import type { SessionStatus } from '../types/session';

const TestConsumer: React.FC = () => {
    const { squadronId, operatorSn, winchId, status } = useSessionIdentity();
    return (
        <div>
            <span data-testid="squadron">{squadronId}</span>
            <span data-testid="operator">{operatorSn}</span>
            <span data-testid="winch">{winchId === null ? 'none' : winchId}</span>
            <span data-testid="status">{status.status}</span>
        </div>
    );
};

describe('SessionIdentityProvider', () => {
    it('throws error when useSessionIdentity is used outside provider', () => {
        // Suppress console.error in React when error boundary catches thrown error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            render(<TestConsumer />);
        }).toThrow('useSessionIdentity must be used within SessionIdentityProvider');

        consoleSpy.mockRestore();
    });

    it('provides session identity values to consumer components', () => {
        render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={7}>
                <TestConsumer />
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('squadron')).toHaveTextContent('621 VGS');
        expect(screen.getByTestId('operator')).toHaveTextContent('OP-1234');
        expect(screen.getByTestId('winch')).toHaveTextContent('7');
        expect(screen.getByTestId('status')).toHaveTextContent('open');
    });

    it('handles status prop directly and derives winchId', () => {
        const closedStatus: SessionStatus = { status: 'closed', winchId: 9 };
        render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" status={closedStatus}>
                <TestConsumer />
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('squadron')).toHaveTextContent('621 VGS');
        expect(screen.getByTestId('operator')).toHaveTextContent('OP-1234');
        expect(screen.getByTestId('winch')).toHaveTextContent('9');
        expect(screen.getByTestId('status')).toHaveTextContent('closed');
    });

    it('handles unselected status', () => {
        const unselectedStatus: SessionStatus = { status: 'unselected' };
        render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" status={unselectedStatus}>
                <TestConsumer />
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('winch')).toHaveTextContent('none');
        expect(screen.getByTestId('status')).toHaveTextContent('unselected');
    });

    it('handles null winchId and updates when props change', () => {
        const { rerender } = render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={null}>
                <TestConsumer />
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('winch')).toHaveTextContent('none');
        expect(screen.getByTestId('status')).toHaveTextContent('unselected');

        rerender(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={42}>
                <TestConsumer />
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('winch')).toHaveTextContent('42');
        expect(screen.getByTestId('status')).toHaveTextContent('open');
    });
});
