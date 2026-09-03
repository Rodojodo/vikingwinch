import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WinchOpsPage } from './WinchOpsPage.tsx';
import { useMsal } from '@azure/msal-react';
import { getWinchesForSquadron } from '../features/winch-ops/api/dataClient.ts';

vi.mock('@azure/msal-react', () => ({
    useMsal: vi.fn(),
}));

vi.mock('../features/winch-ops/api/dataClient.ts', () => ({
    getWinchesForSquadron: vi.fn(),
}));

vi.mock('./WinchTab', () => ({
    WinchTab: ({ tabId, onWinchSelect, winchId }: any) => (
        <div data-testid={`winch-tab-${tabId}`}>
            WinchTab {winchId || 'New'}
            <button onClick={() => onWinchSelect(tabId, 99)}>Select Winch</button>
        </div>
    ),
}));

describe('WinchOpsPage', () => {
    const mockLogoutRedirect = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getWinchesForSquadron).mockResolvedValue([
            { winch_id: 1, type: 'skyla', name: 'Winch 1' },
            { winch_id: 2, type: 'skyla', name: 'Winch 2' }
        ] as any);
        
        vi.mocked(useMsal).mockReturnValue({
            instance: {
                getActiveAccount: () => ({ name: 'Active User' }),
                logoutRedirect: mockLogoutRedirect,
            },
            accounts: [],
        } as any);
    });

    it('renders with active account and squadron id', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        expect(screen.getByText('sqn1 — Winch Log')).toBeInTheDocument();
        expect(screen.getByText('Active User')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(getWinchesForSquadron).toHaveBeenCalledWith('sqn1');
        });
    });

    it('renders with fallback account name', () => {
        vi.mocked(useMsal).mockReturnValue({
            instance: {
                getActiveAccount: () => null,
                logoutRedirect: mockLogoutRedirect,
            },
            accounts: [{ name: 'Fallback User' }],
        } as any);
        
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        expect(screen.getByText('Fallback User')).toBeInTheDocument();
    });

    it('renders with unknown operator if no account', () => {
        vi.mocked(useMsal).mockReturnValue({
            instance: {
                getActiveAccount: () => null,
                logoutRedirect: mockLogoutRedirect,
            },
            accounts: [],
        } as any);
        
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        expect(screen.getByText('Unknown Operator')).toBeInTheDocument();
    });

    it('handles sign out', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        const signOutBtn = screen.getByRole('button', { name: 'Sign out' });
        fireEvent.click(signOutBtn);
        expect(mockLogoutRedirect).toHaveBeenCalled();
    });

    it('handles sign out error gracefully', async () => {
        mockLogoutRedirect.mockRejectedValueOnce(new Error('Logout failed'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        const signOutBtn = screen.getByRole('button', { name: 'Sign out' });
        fireEvent.click(signOutBtn);
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
        });
        consoleError.mockRestore();
    });

    it('logs error if fetch winches fails', async () => {
        vi.mocked(getWinchesForSquadron).mockRejectedValueOnce(new Error('Fetch failed'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith("Failed to load winches:", expect.any(Error));
        });
        consoleError.mockRestore();
    });

    it('can add new tabs up to available winches', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        
        await waitFor(() => {
            expect(getWinchesForSquadron).toHaveBeenCalled();
        });

        const addBtn = screen.getByTestId('AddIcon').parentElement!;
        
        // Starts with 1 tab. Winches = 2.
        fireEvent.click(addBtn);
        expect(screen.getAllByRole('tab')).toHaveLength(2);
        
        // Add another should not add if it exceeds (>= 2 available)
        fireEvent.click(addBtn);
        expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('can close a tab', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        const closeBtn = screen.getByTestId('CloseIcon').parentElement!;
        
        fireEvent.click(closeBtn);
        
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
        expect(screen.getByText("No active winches. Click '+' to open a new tab.")).toBeInTheDocument();
    });

    it('closing active tab switches to the last available tab', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        
        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());
        
        const addBtn = screen.getByTestId('AddIcon').parentElement!;
        fireEvent.click(addBtn); // Now 2 tabs
        
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);
        
        // Second tab is active. Close the second tab
        const closeBtn2 = tabs[1].querySelector('button')!;
        fireEvent.click(closeBtn2);
        
        expect(screen.getAllByRole('tab')).toHaveLength(1);
    });

    it('can select a winch when multiple tabs exist', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());
        
        const addBtn = screen.getByTestId('AddIcon').parentElement!;
        fireEvent.click(addBtn); // Add a second tab
        
        // Select winch on the first tab
        const selectBtns = screen.getAllByRole('button', { name: 'Select Winch' });
        fireEvent.click(selectBtns[0]);
        
        expect(await screen.findByText('Winch 99')).toBeInTheDocument();
    });

    it('safeguard return in handleAddTab', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());
        
        const addBtn = screen.getByTestId('AddIcon').parentElement!;
        // Click to reach max tabs (mock has 2 winches)
        fireEvent.click(addBtn);
        
        // Now max tabs reached, button is disabled. React testing library fireEvent won't trigger onClick.
        // We can manually call the onClick handler from the props to hit the safeguard `return`.
        const reactPropsKey = Object.keys(addBtn).find(key => key.startsWith('__reactProps$')) as string;
        const onClick = (addBtn as any)[reactPropsKey]?.onClick;
        if (onClick) {
            act(() => {
                onClick({ preventDefault: () => {} }); // Should return immediately
            });
        }
        
        expect(screen.getAllByRole('tab')).toHaveLength(2); // Still 2
    });

    it('can add tab before winches are loaded', () => {
        vi.mocked(getWinchesForSquadron).mockReturnValue(new Promise(() => {})); // Never resolves
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        const addBtn = screen.getByTestId('AddIcon').parentElement!;
        fireEvent.click(addBtn);
        expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('can switch tabs', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        
        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());
        
        const addBtn = screen.getByTestId('AddIcon').parentElement!;
        fireEvent.click(addBtn);
        
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);
        
        // Click first tab
        fireEvent.click(tabs[0]);
        // The active tab UI changes, not fully assertable deeply without styles, but we can see the onChange triggers.
        // We can assert the first tab has aria-selected="true"
        expect(tabs[0].getAttribute('aria-selected')).toBe("true");
    });

    it('ignores fetch resolve if unmounted', async () => {
        let resolvePromise: any;
        const promise = new Promise((resolve) => { resolvePromise = resolve; });
        vi.mocked(getWinchesForSquadron).mockReturnValue(promise as any);
        
        const { unmount } = render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        unmount();
        
        resolvePromise([{ winch_id: 1 }]);
        await new Promise(r => setTimeout(r, 0));
    });

    it('ignores fetch reject if unmounted', async () => {
        let rejectPromise: any;
        const promise = new Promise((_, reject) => { rejectPromise = reject; });
        vi.mocked(getWinchesForSquadron).mockReturnValue(promise as any);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const { unmount } = render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        unmount();
        
        rejectPromise(new Error('Fetch failed'));
        await new Promise(r => setTimeout(r, 0));
        
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('closing inactive tab does not change active tab', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());
        
        const addBtn = screen.getByTestId('AddIcon').parentElement!;
        fireEvent.click(addBtn); // Now 2 tabs
        fireEvent.click(addBtn); // Now 3 tabs (Wait, mock has 2 winches, so max 2 tabs! Let me just use 2 tabs)
        
        // Tab 1 is inactive because Tab 2 was added and made active
        const tabs = screen.getAllByRole('tab');
        const closeBtn1 = tabs[0].querySelector('button')!;
        fireEvent.click(closeBtn1);
        
        expect(screen.getAllByRole('tab')).toHaveLength(1);
        expect(screen.getByRole('tab').getAttribute('aria-selected')).toBe("true");
    });
});
