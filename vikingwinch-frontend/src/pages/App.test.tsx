import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App.tsx';
import { getUserDepartment } from '../features/auth/api/graphAPI';

// Mock MSAL
const mockUseMsal = vi.fn();
vi.mock('@azure/msal-react', () => ({
    useMsal: () => mockUseMsal(),
    AuthenticatedTemplate: ({ children }: any) => {
        const { accounts } = mockUseMsal();
        return accounts.length > 0 ? <>{children}</> : null;
    },
    UnauthenticatedTemplate: ({ children }: any) => {
        const { accounts } = mockUseMsal();
        return accounts.length === 0 ? <>{children}</> : null;
    }
}));

// Mock Graph API
vi.mock('../features/auth/api/graphAPI', () => ({
    getUserDepartment: vi.fn()
}));

// Mock Pages
vi.mock('./WinchOpsPage', () => ({
    WinchOpsPage: ({ squadronId, operatorSn }: any) => (
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

    it('shows loading state while fetching graph data when authenticated', () => {
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token123' }) },
            accounts: [{ name: 'Test User' }],
            inProgress: 'none'
        });
        
        // Don't resolve getUserDepartment immediately to keep it in loading state
        vi.mocked(getUserDepartment).mockImplementation(() => new Promise(() => {}));

        render(<App />);
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('renders WinchOpsPage with user data after successful fetch', async () => {
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token123' }) },
            accounts: [{ name: 'Test User' }],
            inProgress: 'none'
        });

        vi.mocked(getUserDepartment).mockResolvedValue({
            displayName: 'Test Operator',
            department: '999 VGS'
        });

        render(<App />);
        
        await waitFor(() => {
            expect(screen.getByTestId('winch-ops-page')).toBeInTheDocument();
        });
        
        expect(screen.getByText('999 VGS - Test Operator')).toBeInTheDocument();
    });
    
    it('handles Graph API error gracefully and stays in loading state', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockUseMsal.mockReturnValue({
            instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token123' }) },
            accounts: [{ name: 'Test User' }],
            inProgress: 'none'
        });

        vi.mocked(getUserDepartment).mockRejectedValue(new Error('Network error'));

        render(<App />);
        
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Failed to load user profile:", expect.any(Error));
        });
        
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
        
        consoleSpy.mockRestore();
    });
});
