import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {DailyInspectionPanel} from './DailyInspectionPanel.tsx';
import {useSessionIdentity} from '../../../app/hooks/useSessionIdentity.ts';
import {getBroughtForward, getWinchHours} from '../api/winchClient.ts';

vi.mock('../../../app/hooks/useSessionIdentity.ts', () => ({
    useSessionIdentity: vi.fn(),
}));

vi.mock('../api/winchClient.ts', () => ({
    getBroughtForward: vi.fn(),
    getWinchHours: vi.fn(),
}));

describe('DailyInspectionPanel', () => {
    const mockOnComplete = vi.fn();
    const mockOnSignDI = vi.fn();
    const mockOnSubmitCorrections = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getBroughtForward).mockResolvedValue({left: null, right: null, hours: null});
        vi.mocked(getWinchHours).mockResolvedValue({hours: null});
        vi.mocked(useSessionIdentity).mockReturnValue({
            squadronId: 'sqn1',
            winchId: 42,
            operatorSn: 'OP1',
            status: { status: 'open', winchId: 42 },
        });
    });

    it('renders the component with inputs', () => {
        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);
        expect(screen.getByText('Winch 42')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. 12')).toBeInTheDocument(); // left drum
        expect(screen.getByPlaceholderText('e.g. 5')).toBeInTheDocument(); // right drum
        expect(screen.getByPlaceholderText('e.g. 123.5')).toBeInTheDocument(); // hours
        expect(screen.getByRole('button', { name: 'Retrieve data from cloud' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign DI' })).toBeInTheDocument();
    });

    it('retrieves data from cloud and updates fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.5});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 150.5});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);
        await waitFor(() => {
            expect(screen.getByDisplayValue('150.5')).toBeInTheDocument();
        });
    });

    it('disables Sign DI and Retrieve buttons while retrieving data from cloud on mount', async () => {
        let resolveBf: (val: { left: number | null; right: number | null; hours: number | null }) => void;
        vi.mocked(getBroughtForward).mockImplementation(() => new Promise((resolve) => {
            resolveBf = resolve;
        }));
        vi.mocked(getWinchHours).mockResolvedValue({hours: 100});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        expect(signBtn).toBeDisabled();
        expect(retrieveBtn).toBeDisabled();

        resolveBf!({left: 10, right: 10, hours: 100});
        await waitFor(() => {
            expect(signBtn).not.toBeDisabled();
            expect(retrieveBtn).not.toBeDisabled();
        });
    });

    it('fetches cloud data once on mount and populates fields when clicking retrieve button without re-fetching', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.5});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 150.5});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await waitFor(() => {
            expect(retrieveBtn).not.toBeDisabled();
        });

        // Click retrieve button - populates fields from single fetch
        await user.click(retrieveBtn);

        expect(screen.getByDisplayValue('15')).toBeInTheDocument();
        expect(screen.getByDisplayValue('8')).toBeInTheDocument();
        expect(screen.getByDisplayValue('150.5')).toBeInTheDocument();

        // Clicking it again does NOT call API again
        await user.click(retrieveBtn);
        expect(getBroughtForward).toHaveBeenCalledTimes(1);
        expect(getWinchHours).toHaveBeenCalledTimes(1);
    });

    it('handles retrieve data missing fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: null, right: null, hours: null});
        vi.mocked(getWinchHours).mockResolvedValue({hours: null});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(getBroughtForward).toHaveBeenCalledWith(42, expect.any(String));
        });

        expect(screen.queryByDisplayValue('15')).not.toBeInTheDocument();
    });

    it('handles retrieve data api failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();

        vi.mocked(getBroughtForward).mockRejectedValue(new Error('Fetch drums failed'));
        vi.mocked(getWinchHours).mockRejectedValue(new Error('Fetch hours failed'));

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch drums', expect.any(Error));
            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch hours', expect.any(Error));
        });

        consoleSpy.mockRestore();
    });

    it('allows typing in fields and submitting', async () => {
        const user = userEvent.setup();
        mockOnSignDI.mockResolvedValue(undefined);

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');
        await user.type(screen.getByPlaceholderText('e.g. 123.5'), '200.5');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(mockOnSignDI).toHaveBeenCalledWith(200.5);
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('allows submitting with no hours', async () => {
        const user = userEvent.setup();
        mockOnSignDI.mockResolvedValue(undefined);

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(mockOnSignDI).toHaveBeenCalledWith(null);
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('handles submit failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();
        mockOnSignDI.mockRejectedValue(new Error('Submit failed'));

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to sign DI', expect.any(Error));
        });

        expect(mockOnComplete).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('does not submit if session data is missing', async () => {
        vi.mocked(useSessionIdentity).mockReturnValue({
            squadronId: '',
            winchId: null,
            operatorSn: '',
            status: { status: 'unselected' },
        });

        const user = userEvent.setup();
        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(mockOnSignDI).not.toHaveBeenCalled();
    });

    it('does not retrieve data if winchId is missing', async () => {
        vi.mocked(useSessionIdentity).mockReturnValue({
            squadronId: 'sqn1',
            winchId: null,
            operatorSn: 'OP1',
            status: { status: 'unselected' },
        });

        const user = userEvent.setup();
        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        expect(getBroughtForward).not.toHaveBeenCalled();
    });

    it('shows inline warning when drum value differs from cloud value and clears when restored', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        const leftInput = screen.getByPlaceholderText('e.g. 12');
        await waitFor(() => {
            expect(leftInput).toHaveValue(15);
        });

        // Change left drum to 20
        await user.clear(leftInput);
        await user.type(leftInput, '20');

        expect(screen.getByText('Entered: 20, cloud: 15')).toBeInTheDocument();

        // Restore left drum to 15
        await user.clear(leftInput);
        await user.type(leftInput, '15');

        expect(screen.queryByText('Entered: 20, cloud: 15')).not.toBeInTheDocument();
    });

    it('shows inline warning for hours when changed and clears when restored', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});

        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        const hoursInput = screen.getByPlaceholderText('e.g. 123.5');
        await waitFor(() => {
            expect(hoursInput).toHaveValue(50.0);
        });

        // Change hours to 55
        await user.clear(hoursInput);
        await user.type(hoursInput, '55');

        expect(screen.getByText('Entered: 55, cloud: 50')).toBeInTheDocument();

        // Restore hours to 50
        await user.clear(hoursInput);
        await user.type(hoursInput, '50');

        expect(screen.queryByText('Entered: 55, cloud: 50')).not.toBeInTheDocument();
    });

    it('allows signing while inline warnings are displayed (non-blocking)', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);
        mockOnSubmitCorrections.mockResolvedValue([]);

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Retrieve data from cloud' }));

        const leftInput = screen.getByPlaceholderText('e.g. 12');
        await waitFor(() => {
            expect(leftInput).toHaveValue(15);
        });

        await user.clear(leftInput);
        await user.type(leftInput, '20');

        expect(screen.getByText('Entered: 20, cloud: 15')).toBeInTheDocument();

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        expect(signBtn).not.toBeDisabled();
        await user.click(signBtn);

        expect(mockOnSignDI).toHaveBeenCalledWith(50);
        expect(mockOnSubmitCorrections).toHaveBeenCalledWith({left: 20, right: null});
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('submits corrections for both drums when both are changed', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);
        mockOnSubmitCorrections.mockResolvedValue([]);

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Retrieve data from cloud' }));

        const leftInput = screen.getByPlaceholderText('e.g. 12');
        const rightInput = screen.getByPlaceholderText('e.g. 5');
        await waitFor(() => {
            expect(leftInput).toHaveValue(15);
        });

        await user.clear(leftInput);
        await user.type(leftInput, '20');
        await user.clear(rightInput);
        await user.type(rightInput, '10');

        await user.click(screen.getByRole('button', { name: 'Sign DI' }));

        expect(mockOnSignDI).toHaveBeenCalledWith(50);
        expect(mockOnSubmitCorrections).toHaveBeenCalledWith({left: 20, right: 10});
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('submits corrections with null for right drum when only left drum changed', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);
        mockOnSubmitCorrections.mockResolvedValue([]);

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Retrieve data from cloud' }));

        const leftInput = screen.getByPlaceholderText('e.g. 12');
        await waitFor(() => {
            expect(leftInput).toHaveValue(15);
        });

        await user.clear(leftInput);
        await user.type(leftInput, '20');

        await user.click(screen.getByRole('button', { name: 'Sign DI' }));

        expect(mockOnSignDI).toHaveBeenCalledWith(50);
        expect(mockOnSubmitCorrections).toHaveBeenCalledWith({left: 20, right: null});
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('submits corrections with null for left drum when only right drum changed', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);
        mockOnSubmitCorrections.mockResolvedValue([]);

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Retrieve data from cloud' }));

        const rightInput = screen.getByPlaceholderText('e.g. 5');
        await waitFor(() => {
            expect(rightInput).toHaveValue(8);
        });

        await user.clear(rightInput);
        await user.type(rightInput, '12');

        await user.click(screen.getByRole('button', { name: 'Sign DI' }));

        expect(mockOnSignDI).toHaveBeenCalledWith(50);
        expect(mockOnSubmitCorrections).toHaveBeenCalledWith({left: null, right: 12});
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('does not submit corrections when drums match cloud values', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Retrieve data from cloud' }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('e.g. 12')).toHaveValue(15);
        });

        await user.click(screen.getByRole('button', { name: 'Sign DI' }));

        expect(mockOnSignDI).toHaveBeenCalledWith(50);
        expect(mockOnSubmitCorrections).not.toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('calls onSignDI with entered hours and makes no correction call when only hours changed', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Retrieve data from cloud' }));

        const hoursInput = screen.getByPlaceholderText('e.g. 123.5');
        await waitFor(() => {
            expect(hoursInput).toHaveValue(50.0);
        });

        await user.clear(hoursInput);
        await user.type(hoursInput, '65.5');

        await user.click(screen.getByRole('button', { name: 'Sign DI' }));

        expect(mockOnSignDI).toHaveBeenCalledWith(65.5);
        expect(mockOnSubmitCorrections).not.toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('blocks negative and non-integer characters on drum inputs and negative on hours while allowing decimal hours', async () => {
        const user = userEvent.setup();
        render(<DailyInspectionPanel onComplete={mockOnComplete} onSignDI={mockOnSignDI}/>);

        const leftInput = screen.getByPlaceholderText('e.g. 12');
        const hoursInput = screen.getByPlaceholderText('e.g. 123.5');

        // Type negative into drum input
        await user.type(leftInput, '-5');
        // Negative sign should be rejected, resulting in just 5
        expect(leftInput).toHaveValue(5);

        // Try typing decimal point into drum input
        await user.clear(leftInput);
        await user.type(leftInput, '12.5');
        // Decimal point should be rejected, resulting in 125
        expect(leftInput).toHaveValue(125);

        // Try typing negative into hours input
        await user.type(hoursInput, '-10.5');
        // Negative sign should be rejected, resulting in 10.5
        expect(hoursInput).toHaveValue(10.5);

        // Positive fractional value should be allowed on hours input
        await user.clear(hoursInput);
        await user.type(hoursInput, '123.5');
        expect(hoursInput).toHaveValue(123.5);
    });

    it('preserves panel state, disables hours, and retries corrections without re-posting DI when corrections fail', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();

        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);
        mockOnSubmitCorrections.mockRejectedValueOnce(new Error('Network error'));

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Retrieve data from cloud' }));

        const leftInput = screen.getByPlaceholderText('e.g. 12');
        const hoursInput = screen.getByPlaceholderText('e.g. 123.5');
        await waitFor(() => {
            expect(leftInput).toHaveValue(15);
        });

        await user.clear(leftInput);
        await user.type(leftInput, '20');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        // DI posted successfully, but correction failed
        await waitFor(() => {
            expect(screen.getByText('Failed to submit drum corrections.')).toBeInTheDocument();
        });

        expect(mockOnSignDI).toHaveBeenCalledTimes(1);
        expect(mockOnSubmitCorrections).toHaveBeenCalledTimes(1);
        expect(mockOnComplete).not.toHaveBeenCalled();

        // State preserved: entered values still in fields
        expect(leftInput).toHaveValue(20);
        expect(screen.getByPlaceholderText('e.g. 5')).toHaveValue(8);
        expect(hoursInput).toHaveValue(50);

        // Hours field is disabled because DI was already signed
        expect(hoursInput).toBeDisabled();

        // Now retry corrections (mock succeeds this time)
        mockOnSubmitCorrections.mockResolvedValueOnce([]);
        await user.click(signBtn);

        await waitFor(() => {
            expect(mockOnComplete).toHaveBeenCalled();
        });

        // onSignDI must NOT be called again on retry
        expect(mockOnSignDI).toHaveBeenCalledTimes(1);
        expect(mockOnSubmitCorrections).toHaveBeenCalledTimes(2);

        consoleSpy.mockRestore();
    });
it("shows warning and submits corrections when user enters values without clicking retrieve data from cloud", async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 8, hours: 50.0});
        vi.mocked(getWinchHours).mockResolvedValue({hours: 50.0});
        mockOnSignDI.mockResolvedValue(undefined);
        mockOnSubmitCorrections.mockResolvedValue([]);

        render(
            <DailyInspectionPanel
                onComplete={mockOnComplete}
                onSignDI={mockOnSignDI}
                onSubmitCorrections={mockOnSubmitCorrections}
            />
        );

        // Wait for background fetch to complete
        await waitFor(() => {
            expect(getBroughtForward).toHaveBeenCalledWith(42, expect.any(String));
        });

        const leftInput = screen.getByPlaceholderText("e.g. 12");
        const rightInput = screen.getByPlaceholderText("e.g. 5");
        const hoursInput = screen.getByPlaceholderText("e.g. 123.5");

        // Fields remain empty initially without clicking retrieve
        expect(leftInput).toHaveValue(null);
        expect(rightInput).toHaveValue(null);
        expect(hoursInput).toHaveValue(null);

    // User manually types values differing from cloud baseline
        await user.type(leftInput, "25");
        await user.type(rightInput, "8");
        await user.type(hoursInput, "55.0");

    // Warnings appear based on background-fetched cloud baseline
    expect(screen.getByText("Entered: 25, cloud: 15")).toBeInTheDocument();
    expect(screen.getByText("Entered: 55, cloud: 50")).toBeInTheDocument();
    expect(screen.queryByText(/cloud: 8/)).not.toBeInTheDocument();

        // Sign DI
        const signBtn = screen.getByRole("button", { name: "Sign DI" });
        await user.click(signBtn);

        expect(mockOnSignDI).toHaveBeenCalledWith(55.0);
        expect(mockOnSubmitCorrections).toHaveBeenCalledWith({left: 25, right: null});
        expect(mockOnComplete).toHaveBeenCalled();
    });
});
