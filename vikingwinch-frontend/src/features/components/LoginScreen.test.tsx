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
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows login prompt and calls loginRedirect when unauthenticated', () => {
        vi.mocked(msalReact.useMsal).mockReturnValue({
            instance: { loginRedirect: loginRedirectMock } as any,
            accounts: [],
            inProgress: 'none',
        } as any);

        render(<LoginScreen />);

        expect(screen.getByText('Please log in to see your profile.')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Log In with Microsoft'));
        expect(loginRedirectMock).toHaveBeenCalledTimes(1);
    });

    it('fetches and displays department when authenticated', async () => {
        // setup mocks
        acquireTokenMock.mockResolvedValue({ accessToken: 'token-123' });
        vi.mocked(getUserDepartment).mockResolvedValue({ department: 'Kirknewton' });

        vi.mocked(msalReact.useMsal).mockReturnValue({
            instance: { acquireTokenSilent: acquireTokenMock, logoutRedirect: logoutRedirectMock, loginRedirect: loginRedirectMock } as any,
            accounts: [{ name: 'Joe Bloggs', username: 'joe.bloggs100@example.com' } as any],
            inProgress: 'none',
        } as any);

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
        expect(getUserDepartment).toHaveBeenCalledWith('token-123');
    });

    it('calls logoutRedirect when clicking Log Out and shows fallback when department fetch fails', async () => {
        // make acquireToken fail to simulate error path
        acquireTokenMock.mockRejectedValue(new Error('token failed'));
        vi.mocked(getUserDepartment).mockRejectedValue(new Error('api failed'));

        vi.mocked(msalReact.useMsal).mockReturnValue({
            instance: { acquireTokenSilent: acquireTokenMock, logoutRedirect: logoutRedirectMock } as any,
            accounts: [{ name: 'Joe Bloggs' } as any],
            inProgress: 'none',
        } as any);

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

    it('does not fetch user data if inProgress is not none', async () => {
        vi.mocked(msalReact.useMsal).mockReturnValue({
            instance: { acquireTokenSilent: acquireTokenMock } as any,
            accounts: [{ name: 'Joe Bloggs', username: 'joe@example.com' } as any],
            inProgress: 'login',
        } as any);

        render(<LoginScreen />);

        expect(acquireTokenMock).not.toHaveBeenCalled();
        expect(getUserDepartment).not.toHaveBeenCalled();
    });
});