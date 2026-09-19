import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {WinchSelectPanel} from './WinchSelectPanel';
import {getWinchesForSquadron, getWinchDayData} from '../api/winchClient.ts';

vi.mock('../api/winchClient.ts', () => ({
    getWinchesForSquadron: vi.fn(),
    getWinchDayData: vi.fn(),
}));

vi.mock('../../../app/utils/exportWinchLog.ts', () => ({
    exportWinchLogsheet: vi.fn(),
    getTodayDateString: () => '2026-09-19',
    getWinchDayStatus: vi.fn().mockResolvedValue({
        winchId: 1,
        launchCount: 0,
        hasFinishDay: false,
        hasUnfinishedDay: false,
    }),
}));

describe('WinchSelectPanel', () => {
    const mockOnSelectWinch = vi.fn();
    const squadronId = '123 VGS';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getWinchDayData).mockResolvedValue({
            logs: [],
            launches: [],
        });
    });

    it('displays a loading spinner initially', () => {
        vi.mocked(getWinchesForSquadron).mockReturnValue(new Promise(() => {}));

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays winches when successfully fetched and calls onSelectWinch on click', async () => {
        const mockWinches = [
            { id: 1, registration: 'W1', squadron_id: squadronId },
            { id: 2, registration: 'W2', squadron_id: squadronId },
        ];
        vi.mocked(getWinchesForSquadron).mockResolvedValue(mockWinches);

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const btn1 = await screen.findByRole('button', { name: 'Winch 1' });
        const btn2 = screen.getByRole('button', { name: 'Winch 2' });

        expect(btn1).toBeInTheDocument();
        expect(btn2).toBeInTheDocument();

        fireEvent.click(btn1);
        expect(mockOnSelectWinch).toHaveBeenCalledWith(1);
    });

    it('displays an error message when API call fails', async () => {
        vi.mocked(getWinchesForSquadron).mockRejectedValue(new Error('API error'));

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const errorMsg = await screen.findByText('Failed to load winches');
        expect(errorMsg).toBeInTheDocument();
    });

    it('displays a message when no winches are returned', async () => {
        vi.mocked(getWinchesForSquadron).mockResolvedValue([]);

        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[]} onSelectWinch={mockOnSelectWinch} />);

        const emptyMsg = await screen.findByText('No winches available for this squadron.');
        expect(emptyMsg).toBeInTheDocument();
        expect(screen.getByText('No winches available for export.')).toBeInTheDocument();
    });

    it('filters out winches that are already open for selection but keeps them available for export', async () => {
        const mockWinches = [
            { id: 1, squadron_id: squadronId, registration: 'W1', name: 'Winch 1' },
            { id: 2, squadron_id: squadronId, registration: 'W2', name: 'Winch 2' },
        ];
        vi.mocked(getWinchesForSquadron).mockResolvedValue(mockWinches);

        // Winch 1 is open
        render(<WinchSelectPanel squadronId={squadronId} openWinchIds={[1]} onSelectWinch={mockOnSelectWinch} />);

        // Winch 2 should appear in selection
        const btn2 = await screen.findByRole('button', { name: 'Winch 2' });
        expect(btn2).toBeInTheDocument();

        // Winch 1 should NOT appear in selection
        const btn1 = screen.queryByRole('button', { name: 'Winch 1' });
        expect(btn1).not.toBeInTheDocument();

        // Both winches must appear in export panel below
        expect(screen.getByRole('button', { name: 'Export Logsheet 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export Logsheet 2' })).toBeInTheDocument();
    });

    it('mounts LogsheetExportPanel and passes onExportLogsheet handler', async () => {
        const mockOnExport = vi.fn().mockResolvedValue(undefined);
        const mockWinches = [
            { id: 1, registration: 'W1', squadron_id: squadronId },
        ];
        vi.mocked(getWinchesForSquadron).mockResolvedValue(mockWinches);

        render(
            <WinchSelectPanel
                squadronId={squadronId}
                openWinchIds={[]}
                onSelectWinch={mockOnSelectWinch}
                onExportLogsheet={mockOnExport}
            />
        );

        const exportBtn = await screen.findByRole('button', { name: 'Export Logsheet 1' });
        fireEvent.click(exportBtn);

        expect(mockOnExport).toHaveBeenCalledWith(1);
        await waitFor(() => {
            expect(exportBtn).toBeEnabled();
        });
    });
});
