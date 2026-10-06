import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App.tsx';
import { getCurrentOperator } from '../core/http/operatorsClient';

// Mock MSAL
const mockUseMsal = vi.fn();
vi.mock('@azure/msal-react', () => ({
    useMsal: () => mockUseMsal(),
    AuthenticatedTemplate: ({ children }: { children?: React.ReactNode }) => {
        const { accounts } = mockUseMsal();
        return accounts.length > 0 ? <>{children}</> : null;
    },
    UnauthenticatedTemplate: ({ children }: { children?: React.ReactNode }) => {
        const { accounts } = mockUseMsal();
        return accounts.length === 0 ? <>{children}</> : null;
    }
}));

vi.mock('../core/http/operatorsClient', () => ({
    getCurrentOperator: vi.fn(),
}));

// Mock Pages
vi.mock('./WinchOpsPage', () => ({
    WinchOpsPage: ({ squadronId, operatorSn }: { squadronId: string; operatorSn: string }) => (
        <div data-testid="winch-ops-page">{squadronId} - {operatorSn}</div>
    )
}));

vi.mock('./LoginPage', () => ({
    LoginPage: () => <div data-testid="login-page" />
}));

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login page when unauthenticated', () => {
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn() },
            accounts: [],
            inProgress: 'none'
        });

        render(<App />);
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    it('shows loading state while fetching the operator when authenticated', () => {
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token123' }) },
            accounts: [{ name: 'Test User' }],
            inProgress: 'none'
        });
        
        vi.mocked(getCurrentOperator).mockImplementation(() => new Promise(() => {}));

        render(<App />);
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('renders WinchOpsPage with operator data after successful fetch', async () => {
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token123' }) },
            accounts: [{ name: 'Test User' }],
            inProgress: 'none'
        });

        vi.mocked(getCurrentOperator).mockResolvedValue({
            service_no: 'SGT-2005',
            name: 'Test Operator',
            squadron_id: '999 VGS',
        });

        render(<App />);
        
        await waitFor(() => {
            expect(screen.getByTestId('winch-ops-page')).toBeInTheDocument();
        });
        
        expect(screen.getByText('999 VGS - SGT-2005')).toBeInTheDocument();
    });
    
    it('handles operator API errors gracefully and shows error message', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token123' }) },
            accounts: [{ name: 'Test User' }],
            inProgress: 'none'
        });

        vi.mocked(getCurrentOperator).mockRejectedValue(new Error('Network error'));

        render(<App />);
        
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Failed to load authenticated operator:", expect.any(Error));
        });
        
        expect(screen.getByText('Failed to load your operator profile.')).toBeInTheDocument();
        expect(screen.getByText('Return to Login')).toBeInTheDocument();
        
        consoleSpy.mockRestore();
    });

    it('does not render the operational page when the operator profile is unavailable', async () => {
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token123' }) },
            accounts: [{ name: 'Test User' }],
            inProgress: 'none'
        });

        vi.mocked(getCurrentOperator).mockRejectedValue(new Error('Incomplete profile'));

        render(<App />);
        
        await waitFor(() => {
            expect(screen.getByText('Failed to load your operator profile.')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('winch-ops-page')).not.toBeInTheDocument();
    });
});
