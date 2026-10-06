import {render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {getCurrentOperator} from '../core/http/operatorsClient.ts';

const mockUseUser = vi.fn();
const mockGetToken = vi.fn().mockResolvedValue(null);

vi.mock('@clerk/react', () => ({
    useUser: () => mockUseUser(),
    useAuth: () => ({getToken: mockGetToken}),
    Show: ({when, children}: { when: 'signed-in' | 'signed-out'; children: React.ReactNode }) => {
        const {isLoaded, isSignedIn} = mockUseUser();
        if (!isLoaded) return null;
        if (when === 'signed-in' && isSignedIn) return <>{children}</>;
        if (when === 'signed-out' && !isSignedIn) return <>{children}</>;
        return null;
    },
    UserButton: () => <button data-testid="user-button">User Button</button>,
    SignInButton: ({children}: { children: React.ReactNode }) => <>{children}</>,
    SignUpButton: ({children}: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({instance: {}, accounts: []}),
    AuthenticatedTemplate: () => null,
    UnauthenticatedTemplate: () => null,
}));

vi.mock('./WinchOpsPage', () => ({
    WinchOpsPage: ({squadronId, operatorSn}: { squadronId: string; operatorSn: string }) => (
        <div data-testid="winch-ops-page">{squadronId} - {operatorSn}</div>
    )
}));

vi.mock('./LoginPage', () => ({
    LoginPage: () => <div data-testid="login-page">Clerk Login Page</div>
}));

vi.mock('../core/http/operatorsClient.ts', () => ({
    getCurrentOperator: vi.fn(),
}));

describe('App (Clerk mode)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_TEST_AUTH_PROVIDER', 'clerk');
    });

    it('shows loading state while profile is loading', async () => {
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({isLoaded: false, isSignedIn: false, user: null});

        render(<App/>);
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('renders login page when signed out', async () => {
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({isLoaded: true, isSignedIn: false, user: null});

        render(<App/>);
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('opens the operational app for the authenticated operator returned by the API', async () => {
        vi.mocked(getCurrentOperator).mockResolvedValue({
            service_no: 'OFF-1001',
            name: 'Joe Bloggs',
            squadron_id: '123 VGS',
        });
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {id: 'user_123'},
        });

        render(<App/>);
        expect(await screen.findByTestId('winch-ops-page')).toBeInTheDocument();
        expect(screen.getByText('123 VGS - OFF-1001')).toBeInTheDocument();
        expect(getCurrentOperator).toHaveBeenCalledOnce();
        expect(screen.queryByText('Select an Operator')).not.toBeInTheDocument();
    });

    it('shows an account mapping error when the authenticated user is not an operator', async () => {
        vi.mocked(getCurrentOperator).mockRejectedValue(new Error('not mapped'));
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {id: 'user_123'},
        });

        render(<App/>);
        expect(await screen.findByText(/not mapped to an operator/i)).toBeInTheDocument();
    });

    it('clears the previous operator while a new account is resolving', async () => {
        const firstOperator = Promise.resolve({
            service_no: 'OFF-1001',
            name: 'Joe Bloggs',
            squadron_id: '123 VGS',
        });
        let resolveSecondOperator: ((operator: {
            service_no: string;
            name: string;
            squadron_id: string;
        }) => void) | undefined;
        const secondOperator = new Promise<{
            service_no: string;
            name: string;
            squadron_id: string;
        }>((resolve) => {
            resolveSecondOperator = resolve;
        });
        vi.mocked(getCurrentOperator)
            .mockReturnValueOnce(firstOperator)
            .mockReturnValueOnce(secondOperator);

        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {id: 'user_123'},
        });
        const {rerender} = render(<App/>);

        expect(await screen.findByText('123 VGS - OFF-1001')).toBeInTheDocument();

        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {id: 'user_456'},
        });
        rerender(<App/>);

        await waitFor(() => expect(screen.queryByText('123 VGS - OFF-1001')).not.toBeInTheDocument());
        expect(screen.getByText('Loading operator profile...')).toBeInTheDocument();

        resolveSecondOperator?.({
            service_no: 'OFF-1002',
            name: 'Sarah Jenkins',
            squadron_id: '123 VGS',
        });
        expect(await screen.findByText('123 VGS - OFF-1002')).toBeInTheDocument();
    });
});
