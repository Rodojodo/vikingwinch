import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginScreen from './LoginScreen';
import * as msalReact from '@azure/msal-react';

// 1. Mock the entire msal-react module
vi.mock('@azure/msal-react', async () => {
    const actual = await vi.importActual('@azure/msal-react');
    return {
        ...actual,
        useMsal: vi.fn(),
        // Force templates to render based on the mocked useMsal state
        AuthenticatedTemplate: ({ children }: any) => {
            const { accounts } = msalReact.useMsal();
            return accounts.length > 0 ? children : null;
        },
        UnauthenticatedTemplate: ({ children }: any) => {
            const { accounts } = msalReact.useMsal();
            return accounts.length === 0 ? children : null;
        }
    };
});

describe('Login Screen Component', () => {
    let mockLoginRedirect: any;

    beforeEach(() => {
        mockLoginRedirect = vi.fn().mockResolvedValue(undefined);
    });

    it('displays the login prompt when unauthenticated', () => {
        // Mock state: No accounts logged in
        vi.spyOn(msalReact, 'useMsal').mockReturnValue({
            instance: { loginRedirect: mockLoginRedirect } as any,
            accounts: [],
            inProgress: 'none',
        });

        render(<LoginScreen />);

        expect(screen.getByText('Please log in to see your profile.')).toBeInTheDocument();

        // Ensure clicking login calls our mock, not the real Microsoft API
        fireEvent.click(screen.getByText('Log In with Microsoft'));
        expect(mockLoginRedirect).toHaveBeenCalledTimes(1);
    });

    it('displays the welcome message when authenticated', () => {
        // Mock state: One account logged in
        vi.spyOn(msalReact, 'useMsal').mockReturnValue({
            instance: {} as any,
            accounts: [{ name: 'Viking User', username: 'viking@example.com' } as any],
            inProgress: 'none',
        });

        render(<LoginScreen />);

        expect(screen.getByText('Welcome, Viking User!')).toBeInTheDocument();
    });
});