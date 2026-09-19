import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {LogsheetExportPanel} from './LogsheetExportPanel';
import {getWinchesForSquadron, getWinchDayData} from '../api/winchClient';
import {exportWinchLogsheet} from '../../../app/utils/exportWinchLog';
import type {Winch} from '../types';

vi.mock('../api/winchClient', () => ({
    getWinchesForSquadron: vi.fn(),
    getWinchDayData: vi.fn(),
}));

vi.mock('../../../app/utils/exportWinchLog', async () => {
    const actual = await vi.importActual<typeof import('../../../app/utils/exportWinchLog')>('../../../app/utils/exportWinchLog');
    return {
        ...actual,
        exportWinchLogsheet: vi.fn(),
        getTodayDateString: () => '2026-09-19',
    };
});

describe('LogsheetExportPanel', () => {
    const squadronId = '621 VGS';
    const mockWinches: Winch[] = [
        { id: 1, registration: 'W1', squadronId },
        { id: 2, registration: 'W2', squadronId },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getWinchesForSquadron).mockResolvedValue([
            { id: 1, registration: 'W1', squadron_id: squadronId },
            { id: 2, registration: 'W2', squadron_id: squadronId },
        ]);
        vi.mocked(getWinchDayData).mockResolvedValue({
            logs: [],
            launches: [],
        });
    });

    it('renders panel with title Export Logsheets and empty message when no winches have finished day and no notices', async () => {
        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Export Logsheets' })).toBeInTheDocument();
        expect(await screen.findByText('No logsheets ready for export.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Export Winch/ })).not.toBeInTheDocument();
    });

    it('renders export buttons only for winches with completed finish-day log', async () => {
        vi.mocked(getWinchDayData).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    logs: [
                        {
                            id: 1,
                            winch_id: 1,
                            squadron_id: squadronId,
                            type: 'finish_day',
                            timestamp: '2026-09-19T17:00:00Z',
                            operator_sn: 'OP1',
                        },
                    ],
                    launches: [
                        {
                            launch_id: 101,
                            launch_number: 1,
                            winch_id: 1,
                            squadron_id: squadronId,
                            drum: 'left',
                            timestamp: '2026-09-19T09:00:00Z',
                            operator_sn: 'OP1',
                        },
                    ],
                };
            }
            return { logs: [], launches: [] };
        });

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Export Logsheets' })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'Export Winch 1' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 2' })).not.toBeInTheDocument();
        expect(screen.queryByText(/has launches but day not finished/)).not.toBeInTheDocument();
    });

    it('fetches winches if winches prop is not provided', async () => {
        vi.mocked(getWinchDayData).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    logs: [
                        {
                            id: 1,
                            winch_id: 1,
                            squadron_id: squadronId,
                            type: 'finish_day',
                            timestamp: '2026-09-19T17:00:00Z',
                            operator_sn: 'OP1',
                        },
                    ],
                    launches: [],
                };
            }
            return { logs: [], launches: [] };
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
        vi.mocked(getWinchDayData).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    logs: [
                        {
                            id: 1,
                            winch_id: 1,
                            squadron_id: squadronId,
                            type: 'di',
                            timestamp: '2026-09-19T08:00:00Z',
                            operator_sn: 'OP1',
                        },
                    ],
                    launches: [
                        {
                            launch_id: 101,
                            launch_number: 1,
                            winch_id: 1,
                            squadron_id: squadronId,
                            drum: 'left',
                            timestamp: '2026-09-19T09:00:00Z',
                            operator_sn: 'OP1',
                        },
                    ],
                };
            }
            return { logs: [], launches: [] };
        });

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByText('Winch 1 has launches but day not finished')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 1' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 2' })).not.toBeInTheDocument();
        expect(screen.queryByText('Winch 2 has launches but day not finished')).not.toBeInTheDocument();
    });

    it('renders both export button and notice when mixed winches exist', async () => {
        vi.mocked(getWinchDayData).mockImplementation(async (winchId) => {
            if (winchId === 1) {
                return {
                    logs: [
                        {
                            id: 1,
                            winch_id: 1,
                            squadron_id: squadronId,
                            type: 'finish_day',
                            timestamp: '2026-09-19T17:00:00Z',
                            operator_sn: 'OP1',
                        },
                    ],
                    launches: [
                        {
                            launch_id: 101,
                            launch_number: 1,
                            winch_id: 1,
                            squadron_id: squadronId,
                            drum: 'left',
                            timestamp: '2026-09-19T09:00:00Z',
                            operator_sn: 'OP1',
                        },
                    ],
                };
            }
            if (winchId === 2) {
                return {
                    logs: [],
                    launches: [
                        {
                            launch_id: 102,
                            launch_number: 1,
                            winch_id: 2,
                            squadron_id: squadronId,
                            drum: 'right',
                            timestamp: '2026-09-19T10:00:00Z',
                            operator_sn: 'OP2',
                        },
                    ],
                };
            }
            return { logs: [], launches: [] };
        });

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByRole('button', { name: 'Export Winch 1' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export Winch 2' })).not.toBeInTheDocument();
        expect(screen.getByText('Winch 2 has launches but day not finished')).toBeInTheDocument();
    });

    it('displays notices for multiple winches with unfinished days and no export buttons', async () => {
        vi.mocked(getWinchDayData).mockResolvedValue({
            logs: [],
            launches: [
                {
                    launch_id: 101,
                    launch_number: 1,
                    winch_id: 1,
                    squadron_id: squadronId,
                    drum: 'left',
                    timestamp: '2026-09-19T09:00:00Z',
                    operator_sn: 'OP1',
                },
            ],
        });

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByText('Winch 1 has launches but day not finished')).toBeInTheDocument();
        expect(screen.getByText('Winch 2 has launches but day not finished')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Export Winch/ })).not.toBeInTheDocument();
    });

    it('triggers export and handles loading state on button click', async () => {
        vi.mocked(getWinchDayData).mockResolvedValue({
            logs: [
                {
                    id: 1,
                    winch_id: 1,
                    squadron_id: squadronId,
                    type: 'finish_day',
                    timestamp: '2026-09-19T17:00:00Z',
                    operator_sn: 'OP1',
                },
                {
                    id: 2,
                    winch_id: 2,
                    squadron_id: squadronId,
                    type: 'finish_day',
                    timestamp: '2026-09-19T17:05:00Z',
                    operator_sn: 'OP2',
                },
            ],
            launches: [],
        });

        let resolveExport: () => void = () => {};
        vi.mocked(exportWinchLogsheet).mockImplementation(
            () => new Promise<void>((res) => { resolveExport = res; })
        );

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        const btn1 = await screen.findByRole('button', { name: 'Export Winch 1' });
        const btn2 = screen.getByRole('button', { name: 'Export Winch 2' });

        fireEvent.click(btn1);

        expect(exportWinchLogsheet).toHaveBeenCalledWith(1, squadronId);
        expect(btn1).toBeDisabled();
        expect(btn2).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Exporting logsheet 1' })).toBeInTheDocument();

        resolveExport();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Export Winch 1' })).toBeEnabled();
        });
        expect(screen.getByRole('button', { name: 'Export Winch 2' })).toBeEnabled();
    });

    it('calls custom onExport prop if provided', async () => {
        vi.mocked(getWinchDayData).mockResolvedValue({
            logs: [
                {
                    id: 2,
                    winch_id: 2,
                    squadron_id: squadronId,
                    type: 'finish_day',
                    timestamp: '2026-09-19T17:05:00Z',
                    operator_sn: 'OP2',
                },
            ],
            launches: [],
        });

        const mockOnExport = vi.fn().mockResolvedValue(undefined);
        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} onExport={mockOnExport} />);

        const btn2 = await screen.findByRole('button', { name: 'Export Winch 2' });
        fireEvent.click(btn2);

        expect(mockOnExport).toHaveBeenCalledWith(2);
        await waitFor(() => {
            expect(btn2).toBeEnabled();
        });
        expect(exportWinchLogsheet).not.toHaveBeenCalled();
    });

    it('handles export error by displaying error banner and allows retry', async () => {
        vi.mocked(getWinchDayData).mockResolvedValue({
            logs: [
                {
                    id: 1,
                    winch_id: 1,
                    squadron_id: squadronId,
                    type: 'finish_day',
                    timestamp: '2026-09-19T17:00:00Z',
                    operator_sn: 'OP1',
                },
            ],
            launches: [],
        });
        vi.mocked(exportWinchLogsheet).mockRejectedValueOnce(new Error('Export failed due to network'));

        render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        const btn1 = await screen.findByRole('button', { name: 'Export Winch 1' });
        fireEvent.click(btn1);

        expect(await screen.findByText('Export failed due to network')).toBeInTheDocument();
        expect(btn1).toBeEnabled();

        vi.mocked(exportWinchLogsheet).mockResolvedValueOnce(undefined);
        fireEvent.click(btn1);

        await waitFor(() => {
            expect(screen.queryByText('Export failed due to network')).not.toBeInTheDocument();
        });
    });

    it('clears stale unfinished warnings when squadronId changes', async () => {
        vi.mocked(getWinchDayData).mockResolvedValueOnce({
            logs: [],
            launches: [
                {
                    launch_id: 101,
                    launch_number: 1,
                    winch_id: 1,
                    squadron_id: squadronId,
                    drum: 'left',
                    timestamp: '2026-09-19T09:00:00Z',
                    operator_sn: 'OP1',
                },
            ],
        });

        const { rerender } = render(<LogsheetExportPanel squadronId={squadronId} winches={mockWinches} />);

        expect(await screen.findByText('Winch 1 has launches but day not finished')).toBeInTheDocument();

        vi.mocked(getWinchDayData).mockResolvedValue({
            logs: [],
            launches: [],
        });

        rerender(<LogsheetExportPanel squadronId="622 VGS" winches={mockWinches} />);

        await waitFor(() => {
            expect(screen.queryByText('Winch 1 has launches but day not finished')).not.toBeInTheDocument();
        });
    });
});
