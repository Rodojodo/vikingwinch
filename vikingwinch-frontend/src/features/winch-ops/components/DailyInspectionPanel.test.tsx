import { useSessionIdentity } from "../../../app/providers/SessionIdentityProvider.tsx";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyInspectionPanel } from './DailyInspectionPanel.tsx';
import { postDayLogToDb } from "../../day-ops/api/dayOpsClient.ts";
import { getBroughtForward, getWinchHours } from "../../winch-ops/api/winchClient.ts";


vi.mock('../../../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('../../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('../app/providers/SessionIdentityProvider.tsx', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));

vi.mock('../../trainee-ops/hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));
vi.mock('../trainee-ops/hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));
vi.mock('../features/trainee-ops/hooks/useTraineeOps.tsx', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));

vi.mock('../../launch-ops/hooks/useLaunchOps.tsx', () => ({
    useLaunchOps: vi.fn(() => ({ 
        derived: { leftLastRecord: {}, rightLastRecord: {} }, 
        leftHistory: [], 
        rightHistory: [], 
        executeLaunch: vi.fn().mockResolvedValue(undefined), 
        undoLaunch: vi.fn().mockResolvedValue(undefined), 
        addRemarkToState: vi.fn() 
    }))
}));
vi.mock('../launch-ops/hooks/useLaunchOps.tsx', () => ({
    useLaunchOps: vi.fn(() => ({ derived: { leftLastRecord: {}, rightLastRecord: {} }, leftHistory: [], rightHistory: [], executeLaunch: vi.fn().mockResolvedValue(undefined), undoLaunch: vi.fn().mockResolvedValue(undefined), addRemarkToState: vi.fn() }))
}));
vi.mock('../features/launch-ops/hooks/useLaunchOps.tsx', () => ({
    useLaunchOps: vi.fn(() => ({ derived: { leftLastRecord: {}, rightLastRecord: {} }, leftHistory: [], rightHistory: [], executeLaunch: vi.fn().mockResolvedValue(undefined), undoLaunch: vi.fn().mockResolvedValue(undefined), addRemarkToState: vi.fn() }))
}));

vi.mock('../../day-ops/hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));
vi.mock('../day-ops/hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));
vi.mock('../features/day-ops/hooks/useDayOps.tsx', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));


vi.mock("../../day-ops/api/dayOpsClient.ts", () => ({ postDayLogToDb: vi.fn() }));
vi.mock("../../winch-ops/api/winchClient.ts", () => ({ getBroughtForward: vi.fn(), getWinchHours: vi.fn() }));

vi.mock('../api/dataClient.ts', () => ({
    getBroughtForward: vi.fn(),
    getWinchHours: vi.fn(),
    postDayLogToDb: vi.fn(),
}));

describe('DailyInspectionPanel', () => {
    const mockOnComplete = vi.fn();
    

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component with inputs', () => {
        render(<DailyInspectionPanel  onComplete={mockOnComplete} />);
        expect(screen.getByText('Winch 42')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. 12')).toBeInTheDocument(); // left drum
        expect(screen.getByPlaceholderText('e.g. 5')).toBeInTheDocument(); // right drum
        expect(screen.getByPlaceholderText('e.g. 123.5')).toBeInTheDocument(); // hours
        expect(screen.getByRole('button', { name: 'Retrieve data from cloud' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign DI' })).toBeInTheDocument();
    });

    it('retrieves data from cloud and updates fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({ left: 15, right: 8 } as any);
        vi.mocked(getWinchHours).mockResolvedValue({ hours: 150.5 } as any);

        render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(screen.getByDisplayValue('15')).toBeInTheDocument();
            expect(screen.getByDisplayValue('8')).toBeInTheDocument();
            expect(screen.getByDisplayValue('150.5')).toBeInTheDocument();
        });
    });

    it('handles retrieve data missing fields', async () => {
        const user = userEvent.setup();
        vi.mocked(getBroughtForward).mockResolvedValue({ left: null, right: undefined } as any);
        vi.mocked(getWinchHours).mockResolvedValue({ hours: null } as any);

        render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        await waitFor(() => {
            expect(getBroughtForward).toHaveBeenCalledWith(42, expect.any(String));
        });

        // Fields should remain empty
        expect(screen.queryByDisplayValue('15')).not.toBeInTheDocument();
    });

    it('handles retrieve data api failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();

        vi.mocked(getBroughtForward).mockRejectedValue(new Error('Fetch drums failed'));
        vi.mocked(getWinchHours).mockRejectedValue(new Error('Fetch hours failed'));

        render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

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
        vi.mocked(postDayLogToDb).mockResolvedValue({} as any);

        render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');
        await user.type(screen.getByPlaceholderText('e.g. 123.5'), '200.5');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(postDayLogToDb).toHaveBeenCalledWith({
            squadron_id: 'sqn1',
            winch_id: 42,
            operator_sn: 'OP1',
            trainee: null,
            type: 'di',
            cable_check: null,
            hours: 200.5,
        }, 42);

        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('allows submitting with no hours', async () => {
        const user = userEvent.setup();
        vi.mocked(postDayLogToDb).mockResolvedValue({} as any);

        render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

        await user.type(screen.getByPlaceholderText('e.g. 12'), '20');
        await user.type(screen.getByPlaceholderText('e.g. 5'), '10');

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(postDayLogToDb).toHaveBeenCalledWith(expect.objectContaining({
            hours: null,
        }), 42);

        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('handles submit failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();
        vi.mocked(postDayLogToDb).mockRejectedValue(new Error('Submit failed'));

        render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to sign DI', expect.any(Error));
        });

        expect(mockOnComplete).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('does not submit if session data is missing', async () => {
        vi.mocked(useSessionIdentity).mockReturnValue({ squadronId: null, winchId: null, operatorSn: null } as any);

        const user = userEvent.setup();
                render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

        const signBtn = screen.getByRole('button', { name: 'Sign DI' });
        await user.click(signBtn);

        expect(postDayLogToDb).not.toHaveBeenCalled();
    });

    it('does not retrieve data if winchId is missing', async () => {
        vi.mocked(useSessionIdentity).mockReturnValue({ squadronId: 'sqn1', winchId: null, operatorSn: 'OP1' } as any);

        const user = userEvent.setup();
                render(<DailyInspectionPanel  onComplete={mockOnComplete} />);

        const retrieveBtn = screen.getByRole('button', { name: 'Retrieve data from cloud' });
        await user.click(retrieveBtn);

        expect(getBroughtForward).not.toHaveBeenCalled();
    });
});