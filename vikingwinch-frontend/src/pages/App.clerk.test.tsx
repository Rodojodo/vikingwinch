import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mockUseUser = vi.fn();

vi.mock('@clerk/react', () => ({
    useUser: () => mockUseUser(),
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

describe('App (Clerk mode)', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_TEST_AUTH_PROVIDER', 'clerk');
    });

    it('shows loading state while profile is loading', async () => {
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: false,
            isSignedIn: false,
            user: null,
        });

        render(<App/>);
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('renders login page when signed out', async () => {
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: false,
            user: null,
        });

        render(<App/>);
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('winch-ops-page')).not.toBeInTheDocument();
    });

    it('renders WinchOpsPage with user metadata when signed in', async () => {
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {
                fullName: 'Captain Kirk',
                publicMetadata: {
                    squadronId: '622 VGS',
                    operatorSn: 'SN-007',
                }
            },
        });

        render(<App/>);
        expect(screen.getByTestId('winch-ops-page')).toBeInTheDocument();
        expect(screen.getByText('622 VGS - SN-007')).toBeInTheDocument();
    });
});
