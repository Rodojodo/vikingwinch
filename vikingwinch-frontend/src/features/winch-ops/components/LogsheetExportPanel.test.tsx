import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {LogsheetExportPanel} from './LogsheetExportPanel';
import {getExportData, getWinchDayStatus, getWinchesForSquadron} from '../api/winchClient';
import {exportLog} from '../../../app/utils/exportLog';
import type {ExportDataResponse, Winch} from '../types';

vi.mock('../api/winchClient', () => ({
    getWinchesForSquadron: vi.fn(),
    getWinchDayStatus: vi.fn(),
    getExportData: vi.fn(),
}));

vi.mock('../../../app/utils/exportLog', async () => {
    return {
        exportLog: vi.fn().mockResolvedValue(undefined),
        getTodayDateString: () => '2026-09-19',
    };
});

describe('LogsheetExportPanel', () => {
    const squadronId = '621 VGS';
    const mockWinches: Winch[] = [
        { id: 1, registration: 'W1', squadronId },
        { id: 2, registration: 'W2', squadronId },
    ];

    const mockExportData: ExportDataResponse = {
        winch: {id: 1, registration: 'W1', squadron_id: squadronId},
        logs: [],
        launches: [],
        operators: [],
        brought_forward: {left: null, right: null},
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getWinchesForSquadron).mockResolvedValue([
            { id: 1, registration: 'W1', squadron_id: squadronId },
            { id: 2, registration: 'W2', squadron_id: squadronId },
        ]);
        vi.mocked(getWinchDayStatus).mockResolvedValue({
            winch_id: 1,
            has_finish_day: false,
            has_launches: false,
        });
        vi.mocked(getExportData).mockResolvedValue(mockExportData);
    });

    it('renders panel with title Export Logsheets and empty message when no winches have finished day and no notices', async () => {
        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Export Logsheets' })).toBeInTheDocument();
        expect(await screen.findByText('No logsheets ready for export.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Export Winch/ })).not.toBeInTheDocument();
    });

    it('renders export buttons only for winches with completed finish-day log', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    winch_id: 1,
                    has_finish_day: true,
                    has_launches: true,
                };
            }
            return {winch_id: winchId, has_finish_day: false, has_launches: false};
        });

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Export Logsheets' })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'Export Winch 1' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 2' })).not.toBeInTheDocument();
        expect(screen.queryByText(/has launches but day not finished/)).not.toBeInTheDocument();
    });

    it('fetches winches if winches prop is not provided', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    winch_id: 1,
                    has_finish_day: true,
                    has_launches: false,
                };
            }
            return {winch_id: winchId, has_finish_day: false, has_launches: false};
        });

        render(<LogsheetExportPanel squadronId={squadronId} />);

        expect(getWinchesForSquadron).toHaveBeenCalledWith(squadronId);
        expect(await screen.findByRole('button', { name: 'Export Winch 1' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 2' })).not.toBeInTheDocument();
    });

    it('renders empty indicator when squadron has no winches', async () => {
        render(<LogsheetExportPanel squadronId={squadronId} winches={[]} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Export Logsheets' })).toBeInTheDocument();
        expect(screen.getByText('No winches available for export.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Export Winch/ })).not.toBeInTheDocument();
    });

    it('displays notice and NO export button when winch has launches today and no finish_day log', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    winch_id: 1,
                    has_finish_day: false,
                    has_launches: true,
                };
            }
            return {winch_id: winchId, has_finish_day: false, has_launches: false};
        });

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByText('Winch 1 has launches but day not finished')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 1' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 2' })).not.toBeInTheDocument();
        expect(screen.queryByText('Winch 2 has launches but day not finished')).not.toBeInTheDocument();
    });

    it('renders both export button and notice when mixed winches exist', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    winch_id: 1,
                    has_finish_day: true,
                    has_launches: true,
                };
            }
            if (winchId === 2) {
                return {
                    winch_id: 2,
                    has_finish_day: false,
                    has_launches: true,
                };
            }
            return {winch_id: winchId, has_finish_day: false, has_launches: false};
        });

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByRole('button', { name: 'Export Winch 1' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 2' })).not.toBeInTheDocument();
        expect(screen.getByText('Winch 2 has launches but day not finished')).toBeInTheDocument();
    });

    it('displays notices for multiple winches with unfinished days and no export buttons', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => ({
            winch_id: winchId,
            has_finish_day: false,
            has_launches: true,
        }));

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByText('Winch 1 has launches but day not finished')).toBeInTheDocument();
        expect(screen.getByText('Winch 2 has launches but day not finished')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Export Winch/ })).not.toBeInTheDocument();
    });

    it('triggers export and handles loading state on button click', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => ({
            winch_id: winchId,
            has_finish_day: true,
            has_launches: true,
        }));

        let resolveExport!: () => void;
        const exportPromise = new Promise<void>((res) => {
            resolveExport = res;
        });
        vi.mocked(exportLog).mockImplementation(() => exportPromise);

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        const btn1 = await screen.findByRole('button', { name: 'Export Winch 1' });
        const btn2 = screen.getByRole('button', { name: 'Export Winch 2' });

        fireEvent.click(btn1);

        expect(getExportData).toHaveBeenCalledWith(1, squadronId, '2026-09-19');
        expect(btn1).toBeDisabled();
        expect(btn2).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Exporting logsheet 1' })).toBeInTheDocument();

        await act(async () => {
            resolveExport();
        });
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Export Winch 1' })).toBeEnabled();
        });
        expect(screen.getByRole('button', { name: 'Export Winch 2' })).toBeEnabled();
    });

    it('calls custom onExport prop if provided', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => ({
            winch_id: winchId,
            has_finish_day: winchId === 2,
            has_launches: false,
        }));

        const mockOnExport = vi.fn().mockResolvedValue(undefined);
        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} onExport={mockOnExport} />);

        const btn2 = await screen.findByRole('button', { name: 'Export Winch 2' });
        fireEvent.click(btn2);

        expect(mockOnExport).toHaveBeenCalledWith(2);
        await waitFor(() => {
            expect(btn2).toBeEnabled();
        });
        expect(getExportData).not.toHaveBeenCalled();
        expect(exportLog).not.toHaveBeenCalled();
    });

    it('handles export error by displaying error banner and allows retry', async () => {
        vi.mocked(getWinchDayStatus).mockImplementation(async (winchId) => ({
            winch_id: winchId,
            has_finish_day: winchId === 1,
            has_launches: false,
        }));
        vi.mocked(exportLog).mockRejectedValueOnce(new Error('Export failed due to network'));

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        const btn1 = await screen.findByRole('button', { name: 'Export Winch 1' });
        fireEvent.click(btn1);

        expect(await screen.findByText('Export failed due to network')).toBeInTheDocument();
        expect(btn1).toBeEnabled();

        vi.mocked(exportLog).mockResolvedValueOnce(undefined);
        fireEvent.click(btn1);

        await waitFor(() => {
            expect(screen.queryByText('Export failed due to network')).not.toBeInTheDocument();
        });
    });

    it('clears stale unfinished warnings when squadronId changes', async () => {
        vi.mocked(getWinchDayStatus).mockResolvedValueOnce({
            winch_id: 1,
            has_finish_day: false,
            has_launches: true,
        });

        const { rerender } = render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByText('Winch 1 has launches but day not finished')).toBeInTheDocument();

        vi.mocked(getWinchDayStatus).mockResolvedValue({
            winch_id: 1,
            has_finish_day: false,
            has_launches: false,
        });

        rerender(<LogsheetExportPanel squadronId="622 VGS" winches={mockWinches} />);

        await waitFor(() => {
            expect(screen.queryByText('Winch 1 has launches but day not finished')).not.toBeInTheDocument();
        });
    });
});
