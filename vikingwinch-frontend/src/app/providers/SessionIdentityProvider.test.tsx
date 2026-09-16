import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SessionIdentityProvider, useSessionIdentity } from './SessionIdentityProvider';

const TestConsumer: React.FC = () => {
    const { squadronId, operatorSn, winchId } = useSessionIdentity();
    return (
        <div>
            <span data-testid="squadron">{squadronId}</span>
            <span data-testid="operator">{operatorSn}</span>
            <span data-testid="winch">{winchId === null ? 'none' : winchId}</span>
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
    });

    it('handles null winchId and updates when props change', () => {
        const { rerender } = render(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={null}>
                <TestConsumer />
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('winch')).toHaveTextContent('none');

        rerender(
            <SessionIdentityProvider squadronId="621 VGS" operatorSn="OP-1234" winchId={42}>
                <TestConsumer />
            </SessionIdentityProvider>
        );

        expect(screen.getByTestId('winch')).toHaveTextContent('42');
    });
});
