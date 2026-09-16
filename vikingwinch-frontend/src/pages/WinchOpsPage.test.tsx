import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {WinchOpsPage} from './WinchOpsPage.tsx';
import {useMsal} from '@azure/msal-react';
import {getWinchesForSquadron} from '../features/winch-ops/api/winchClient.ts';
import type {WinchRead} from '../features/winch-ops/types';

vi.mock('../features/winch-ops/api/winchClient.ts', () => ({
    getWinchesForSquadron: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: vi.fn(),
}));

vi.mock('./WinchTab', () => ({
    WinchTab: ({tabId, onWinchSelect, winchId}: {
        tabId: string;
        onWinchSelect: (id: string, wId: number) => void;
        winchId: number | null;
    }) => (
        <div data-testid={`winch-tab-${tabId}`}>
            WinchTab {winchId || 'New'}
            <button onClick={() => onWinchSelect(tabId, 99)}>Select Winch</button>
        </div>
    ),
}));

describe('WinchOpsPage', () => {
    const mockLogoutRedirect = vi.fn().mockResolvedValue(undefined);

    const setMsalMock = (accountName: string | null, accounts: Array<{ name: string }> = []) => {
        vi.mocked(useMsal).mockReturnValue({
            instance: {
                getActiveAccount: () => (accountName ? { name: accountName } : null),
                logoutRedirect: mockLogoutRedirect,
            },
            accounts,
        } as never);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getWinchesForSquadron).mockResolvedValue([
            {id: 1, squadron_id: 'sqn1', registration: 'Winch 1'},
            {id: 2, squadron_id: 'sqn1', registration: 'Winch 2'},
        ]);
        setMsalMock('Active User');
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
        setMsalMock(null, [{ name: 'Fallback User' }]);

        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        expect(screen.getByText('Fallback User')).toBeInTheDocument();
    });

    it('renders with unknown operator if no account', () => {
        setMsalMock(null, []);

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
            expect(consoleError).toHaveBeenCalledWith('Failed to load winches:', expect.any(Error));
        });
        consoleError.mockRestore();
    });

    it('can add new tabs up to available winches', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);

        await waitFor(() => {
            expect(getWinchesForSquadron).toHaveBeenCalled();
        });

        const addBtn = screen.getByTestId('AddIcon').parentElement;
        expect(addBtn).not.toBeNull();
        if (addBtn) fireEvent.click(addBtn);
        expect(screen.getAllByRole('tab')).toHaveLength(2);

        if (addBtn) fireEvent.click(addBtn);
        expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('can close a tab', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        const closeBtn = screen.getByTestId('CloseIcon').parentElement;
        expect(closeBtn).not.toBeNull();
        if (closeBtn) fireEvent.click(closeBtn);

        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
        expect(screen.getByText("No active winches. Click '+' to open a new tab.")).toBeInTheDocument();
    });

    it('closing active tab switches to the last available tab', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);

        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());

        const addBtn = screen.getByTestId('AddIcon').parentElement;
        if (addBtn) fireEvent.click(addBtn);

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);

        const closeBtn2 = tabs[1]?.querySelector('[role="button"]');
        expect(closeBtn2).toBeTruthy();
        if (closeBtn2) fireEvent.click(closeBtn2);

        expect(screen.getAllByRole('tab')).toHaveLength(1);
    });

    it('can select a winch when multiple tabs exist', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());

        const addBtn = screen.getByTestId('AddIcon').parentElement;
        if (addBtn) fireEvent.click(addBtn);

        const selectBtns = screen.getAllByRole('button', { name: 'Select Winch' });
        fireEvent.click(selectBtns[0]);

        expect(await screen.findByText('Winch 99')).toBeInTheDocument();
    });

    it('safeguard return in handleAddTab', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());

        const addBtn = screen.getByTestId('AddIcon').parentElement;
        if (addBtn) {
            fireEvent.click(addBtn);

            const reactPropsKey = Object.keys(addBtn).find(key => key.startsWith('__reactProps$')) ?? '';
            const propsRecord = addBtn as HTMLElement & Record<string, { onClick?: (e: unknown) => void }>;
            const props = propsRecord[reactPropsKey];
            if (props?.onClick) {
                act(() => {
                    props.onClick?.({
                        preventDefault: () => {},
                    });
                });
            }
        }

        expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('can add tab before winches are loaded', () => {
        vi.mocked(getWinchesForSquadron).mockReturnValue(new Promise(() => {}));
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        const addBtn = screen.getByTestId('AddIcon').parentElement;
        if (addBtn) fireEvent.click(addBtn);
        expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('can switch tabs', async () => {
        render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);

        await waitFor(() => expect(getWinchesForSquadron).toHaveBeenCalled());

        const addBtn = screen.getByTestId('AddIcon').parentElement;
        if (addBtn) fireEvent.click(addBtn);

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);

        fireEvent.click(tabs[0]);
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    });

    it('ignores fetch resolve if unmounted', async () => {
        let resolvePromise: (val: WinchRead[]) => void = () => {};
        const promise = new Promise<WinchRead[]>((resolve) => { resolvePromise = resolve; });
        vi.mocked(getWinchesForSquadron).mockReturnValue(promise);

        const { unmount } = render(<WinchOpsPage squadronId="sqn1" operatorSn="123" />);
        unmount();

        resolvePromise([{id: 1, squadron_id: 'sqn1', registration: 'W1'}]);
        await new Promise(r => setTimeout(r, 0));
    });

    it('ignores fetch reject if unmounted', async () => {
        let rejectPromise: (reason: unknown) => void = () => {};
        const promise = new Promise<WinchRead[]>((_, reject) => { rejectPromise = reject; });
        vi.mocked(getWinchesForSquadron).mockReturnValue(promise);
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

        const addBtn = screen.getByTestId('AddIcon').parentElement;
        if (addBtn) fireEvent.click(addBtn);

        const tabs = screen.getAllByRole('tab');
        const closeBtn1 = tabs[0]?.querySelector('[role="button"]');
        expect(closeBtn1).toBeTruthy();
        if (closeBtn1) fireEvent.click(closeBtn1);

        expect(screen.getAllByRole('tab')).toHaveLength(1);
        expect(screen.getByRole('tab').getAttribute('aria-selected')).toBe('true');
    });
});
