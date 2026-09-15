import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinishDayPanel } from './FinishDayPanel.tsx';
import { getOperatorsForSquadron } from "../../../core/http/operatorsClient.ts";
import { postDayLogToDb } from '../../day-ops/api/dayOpsClient.ts';
vi.mock('../../day-ops/api/dayOpsClient.ts', () => ({ postDayLogToDb: vi.fn() }));
import { exportLog } from '../../winch-ops/utils/exportLog.ts';


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


vi.mock("../../../core/http/operatorsClient.ts", () => ({ getOperatorsForSquadron: vi.fn() }));

vi.mock('../../winch-ops/api/dataClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

vi.mock('../../winch-ops/utils/exportLog.ts', () => ({
    exportLog: vi.fn().mockResolvedValue(undefined),
}));

describe('FinishDayPanel', () => {
    const mockFinishDay = vi.fn().mockResolvedValue(undefined);
    const mockState = { squadron: 'sqn1', winchId: 1 } as any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([{ service_no: 'OP1', name: 'Operator 1', squadron_id: 'sqn1' }]);
    });

    it('renders Finish Day button and toggles panel', () => {
        render(<FinishDayPanel isLoading={false} />);
        
        expect(screen.queryByText('Hours Stop')).not.toBeVisible();
        
        fireEvent.click(screen.getByRole('button', { name: /Finish Day/i }));
        
        expect(screen.getByText('Hours Stop')).toBeVisible();
        expect(getOperatorsForSquadron).toHaveBeenCalledWith('sqn1', expect.any(AbortSignal));
    });

    it('submits correctly when fields are valid', async () => {
        render(<FinishDayPanel isLoading={false} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        await waitFor(() => {
            expect(screen.getByText('Select...')).toBeInTheDocument();
        });
        
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), { target: { value: '12.5' } });
        
        // Select an operator (Cable Check By)
        fireEvent.mouseDown(screen.getByRole('combobox'));
        await screen.findByRole('listbox');
        fireEvent.click(screen.getByText('Operator 1'));

        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]); // The second one is inside the panel

        await waitFor(() => {
            expect(postDayLogToDb).toHaveBeenCalledWith(expect.objectContaining({ cable_check: 'OP1', hours: 12.5 }), 42);
            expect(screen.queryByText('Hours Stop')).not.toBeVisible();
        });
    });

    it('handles finishDay error', async () => {
        vi.mocked(postDayLogToDb).mockRejectedValueOnce(new Error('Backend error'));
        render(<FinishDayPanel isLoading={false} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]);

        expect(await screen.findByText('Backend error')).toBeInTheDocument();
    });

    it('calls exportLog when Download Log is clicked', async () => {
        render(<FinishDayPanel isLoading={false} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        fireEvent.change(screen.getByPlaceholderText('e.g. 126.2'), { target: { value: '10' } });
        
        fireEvent.click(screen.getByRole('button', { name: 'Download Log' }));

        await waitFor(() => {
            expect(exportLog).toHaveBeenCalledWith(expect.objectContaining({ squadron: 'sqn1', winchId: 42 }));
        });
    });

    it('handles operator fetch error', async () => {
        vi.mocked(getOperatorsForSquadron).mockRejectedValueOnce(new Error('Failed to load'));
        render(<FinishDayPanel isLoading={false} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        expect(await screen.findByText('Failed to load operators')).toBeInTheDocument();
    });

    it('handles exportLog error', async () => {
        vi.mocked(exportLog).mockRejectedValueOnce(new Error('Export failed'));
        render(<FinishDayPanel isLoading={false} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download Log' }));

        expect(await screen.findByText('Export failed')).toBeInTheDocument();
    });

    it('handles finishDay error with non-Error object', async () => {
        vi.mocked(postDayLogToDb).mockRejectedValueOnce('String error');
        render(<FinishDayPanel isLoading={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        const submitBtns = screen.getAllByRole('button', { name: 'Finish Day' });
        fireEvent.click(submitBtns[1]);
        expect(await screen.findByText('Failed to submit finish day')).toBeInTheDocument();
    });

    it('handles exportLog error with non-Error object', async () => {
        vi.mocked(exportLog).mockRejectedValueOnce({ msg: 'Export failed' });
        render(<FinishDayPanel isLoading={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download Log' }));
        expect(await screen.findByText('Failed to download log')).toBeInTheDocument();
    });

    it('shows Submitting... when isLoading is true', () => {
        render(<FinishDayPanel isLoading={true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    });

    it('aborts fetch operators if unmounted before completion', async () => {
        let resolvePromise: any;
        const promise = new Promise((resolve) => { resolvePromise = resolve; });
        vi.mocked(getOperatorsForSquadron).mockReturnValue(promise as any);
        
        const { unmount } = render(<FinishDayPanel isLoading={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        unmount(); // Unmount before resolve
        resolvePromise([{ service_no: 'OP1', name: 'Operator 1', squadron_id: 'sqn1' }]);
        
        // Wait just to ensure no error is thrown
        await new Promise(r => setTimeout(r, 0));
    });

    it('aborts fetch operators and ignores errors if unmounted before completion', async () => {
        let rejectPromise: any;
        const promise = new Promise((_, reject) => { rejectPromise = reject; });
        vi.mocked(getOperatorsForSquadron).mockReturnValue(promise as any);
        
        const { unmount } = render(<FinishDayPanel isLoading={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Finish Day' }));
        
        unmount(); // Unmount before reject
        rejectPromise(new Error('Network error'));
        
        await new Promise(r => setTimeout(r, 0));
    });
});
