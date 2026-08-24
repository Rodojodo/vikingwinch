import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LoginScreen from './LoginScreen';
import * as msalReact from '@azure/msal-react';
import { getUserDepartment } from '../auth/graphAPI.ts';

// Mock msal-react so AuthenticatedTemplate/UnauthenticatedTemplate render based on our mocked useMsal
vi.mock('@azure/msal-react', async () => {
    const actual = await vi.importActual('@azure/msal-react');
    return {
        ...actual,
        useMsal: vi.fn(),
        AuthenticatedTemplate: ({ children }: any) => {
            const { accounts } = msalReact.useMsal();
            return accounts && accounts.length > 0 ? children : null;
        },
        UnauthenticatedTemplate: ({ children }: any) => {
            const { accounts } = msalReact.useMsal();
            return !accounts || accounts.length === 0 ? children : null;
        }
    };
});

// Mock graph API helper
vi.mock('../auth/graphAPI.ts', () => ({
    getUserDepartment: vi.fn(),
}));

describe('LoginScreen', () => {
    const acquireTokenMock = vi.fn();
    const loginRedirectMock = vi.fn().mockResolvedValue(undefined);
    const logoutRedirectMock = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('shows login prompt and calls loginRedirect when unauthenticated', () => {
        (msalReact.useMsal as any).mockReturnValue({
            instance: { loginRedirect: loginRedirectMock } as any,
            accounts: [],
            inProgress: 'none',
        });

        render(<LoginScreen />);

        expect(screen.getByText('Please log in to see your profile.')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Log In with Microsoft'));
        expect(loginRedirectMock).toHaveBeenCalledTimes(1);
    });

    it('fetches and displays department when authenticated', async () => {
        // setup mocks
        acquireTokenMock.mockResolvedValue({ accessToken: 'token-123' });
        (getUserDepartment as jest.Mock | any).mockResolvedValue({ department: 'Kirknewton' });

        (msalReact.useMsal as any).mockReturnValue({
            instance: { acquireTokenSilent: acquireTokenMock, logoutRedirect: logoutRedirectMock, loginRedirect: loginRedirectMock } as any,
            accounts: [{ name: 'Joe Bloggs', username: 'joe.bloggs100@example.com' }],
            inProgress: 'none',
        });

        render(<LoginScreen />);

        // loading starts while fetching
        expect(await screen.findByText('Loading profile details...')).toBeInTheDocument();

        // then department is displayed
        await waitFor(() => {
            expect(screen.getByText(/Department:/)).toBeInTheDocument();
            expect(screen.getByText(/Kirknewton/)).toBeInTheDocument();
        });

        // verify token and API called
        expect(acquireTokenMock).toHaveBeenCalled();
        expect((getUserDepartment as any)).toHaveBeenCalledWith('token-123');
    });

    it('calls logoutRedirect when clicking Log Out and shows fallback when department fetch fails', async () => {
        // make acquireToken fail to simulate error path
        acquireTokenMock.mockRejectedValue(new Error('token failed'));
        (getUserDepartment as any).mockRejectedValue(new Error('api failed'));

        (msalReact.useMsal as any).mockReturnValue({
            instance: { acquireTokenSilent: acquireTokenMock, logoutRedirect: logoutRedirectMock } as any,
            accounts: [{ name: 'Joe Bloggs' }],
            inProgress: 'none',
        });

        render(<LoginScreen />);

        // after error, fallback text shown
        await waitFor(() => {
            expect(screen.getByText(/Department:/)).toBeInTheDocument();
            expect(screen.getByText('No department assigned')).toBeInTheDocument();
        });

        // clicking logout triggers logoutRedirect
        fireEvent.click(screen.getByText('Log Out'));
        expect(logoutRedirectMock).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
});