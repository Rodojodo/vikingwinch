import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {getOperatorsForSquadron} from '../core/http/operatorsClient.ts';

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

vi.mock('../core/http/operatorsClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

describe('App (Clerk mode)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
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

    it('renders OperatorSelectPanel with username as squadronId when signed in without operator selected', async () => {
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { service_no: 'OFF-1001', name: 'Joe Bloggs', squadron_id: '123 VGS' },
        ]);
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {
                username: '123 VGS',
            },
        });

        render(<App/>);
        expect(screen.getByText('Select an Operator')).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'Joe Bloggs' })).toBeInTheDocument();
        expect(getOperatorsForSquadron).toHaveBeenCalledWith('123 VGS');
        expect(screen.queryByTestId('winch-ops-page')).not.toBeInTheDocument();
    });

    it('transitions to WinchOpsPage and stores operator in sessionStorage when an operator is clicked', async () => {
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { service_no: 'OFF-1001', name: 'Joe Bloggs', squadron_id: '123 VGS' },
        ]);
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {
                username: '123 VGS',
            },
        });

        render(<App/>);
        const opButton = await screen.findByRole('button', { name: 'Joe Bloggs' });
        fireEvent.click(opButton);

        expect(sessionStorage.getItem('vikingwinch_operator_sn')).toBe('OFF-1001');
        expect(screen.getByTestId('winch-ops-page')).toBeInTheDocument();
        expect(screen.getByText('123 VGS - OFF-1001')).toBeInTheDocument();
    });

    it('directly renders WinchOpsPage on page reload when sessionStorage contains operator', async () => {
        sessionStorage.setItem('vikingwinch_operator_sn', 'OFF-1001');
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {
                username: '123 VGS',
            },
        });

        render(<App/>);
        expect(screen.getByTestId('winch-ops-page')).toBeInTheDocument();
        expect(screen.getByText('123 VGS - OFF-1001')).toBeInTheDocument();
        expect(screen.queryByText('Select an Operator')).not.toBeInTheDocument();
    });

    it('falls back to publicMetadata.squadronId if username is not present', async () => {
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([]);
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {
                publicMetadata: {
                    squadronId: '622 VGS',
                },
            },
        });

        render(<App/>);
        expect(await screen.findByText('No operators available for this squadron.')).toBeInTheDocument();
        expect(getOperatorsForSquadron).toHaveBeenCalledWith('622 VGS');
    });

    it('falls back to 123 VGS default if neither username nor publicMetadata.squadronId is present', async () => {
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([]);
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {},
        });

        render(<App/>);
        expect(await screen.findByText('No operators available for this squadron.')).toBeInTheDocument();
        expect(getOperatorsForSquadron).toHaveBeenCalledWith('123 VGS');
    });

    it('clears sessionStorage and resets operator state when user signs out', async () => {
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([]);
        sessionStorage.setItem('vikingwinch_operator_sn', 'OFF-1001');
        const {default: App} = await import('./App');
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {
                username: '123 VGS',
            },
        });

        const {rerender} = render(<App/>);
        expect(screen.getByTestId('winch-ops-page')).toBeInTheDocument();

        // Simulate user sign-out
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: false,
            user: null,
        });

        rerender(<App/>);

        expect(sessionStorage.getItem('vikingwinch_operator_sn')).toBeNull();
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('winch-ops-page')).not.toBeInTheDocument();

        // Simulate re-signing in: should render OperatorSelectPanel since operator selection state was reset
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: {
                username: '123 VGS',
            },
        });

        rerender(<App/>);

        expect(await screen.findByText('Select an Operator')).toBeInTheDocument();
        expect(screen.queryByTestId('winch-ops-page')).not.toBeInTheDocument();
    });
});
