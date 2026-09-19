import {beforeEach, describe, expect, it, vi} from 'vitest';
import {exportLog, exportLogFromData, type WinchLogState} from './exportLog.ts';
import * as fileSaver from 'file-saver';
import {getDayLog} from '../../features/day-ops/api/dayOpsClient.ts';
import {getBroughtForward, getWinch} from '../../features/winch-ops/api/winchClient.ts';
import {getOperatorsForSquadron} from '../../core/http/operatorsClient.ts';
import type {ExportDataResponse} from '../../features/winch-ops/types';

vi.mock('../../features/day-ops/api/dayOpsClient.ts', () => ({getDayLog: vi.fn()}));
vi.mock('../../features/winch-ops/api/winchClient.ts', () => ({getWinch: vi.fn(), getBroughtForward: vi.fn()}));
vi.mock('../../core/http/operatorsClient.ts', () => ({getOperatorsForSquadron: vi.fn()}));

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

interface MockCell {
    value: unknown;
}

const mockExcelCells: Record<string, MockCell> = {};

vi.mock('exceljs', () => {
    class Workbook {
        xlsx = {
            load: vi.fn().mockResolvedValue(undefined),
            writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        };
        worksheets = [{
            getCell: vi.fn().mockImplementation((address: string) => {
                if (!mockExcelCells[address]) {
                    mockExcelCells[address] = {value: null};
                }
                return mockExcelCells[address];
            }),
        }];
    }

    return {
        default: {Workbook},
    };
});

describe('exportLog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        for (const key of Object.keys(mockExcelCells)) {
            delete mockExcelCells[key];
        }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        }));
        vi.mocked(getWinch).mockResolvedValue({id: 1, registration: 'REG123', squadron_id: 'sqn1'});
        vi.mocked(getBroughtForward).mockResolvedValue({left: 15, right: 25, hours: 100});
        vi.mocked(getDayLog).mockResolvedValue([
            {
                id: 1,
                winch_id: 1,
                squadron_id: 'sqn1',
                cable_check: null,
                hours: null,
                type: 'sign_on',
                operator_sn: 'OP1',
                trainee: 'TR1',
                timestamp: '2026-09-09T08:00:00Z'
            },
            {
                id: 2,
                winch_id: 1,
                squadron_id: 'sqn1',
                cable_check: null,
                hours: 105,
                type: 'di',
                operator_sn: 'OP1',
                trainee: null,
                timestamp: '2026-09-09T08:30:00Z'
            },
            {
                id: 3,
                winch_id: 1,
                squadron_id: 'sqn1',
                cable_check: 'OP2',
                hours: 110,
                type: 'finish_day',
                operator_sn: 'OP1',
                trainee: null,
                timestamp: '2026-09-09T17:00:00Z'
            }
        ]);
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            {service_no: 'OP1', name: 'John Doe', squadron_id: 'sqn1'},
            {service_no: 'OP2', name: 'Jane Smith', squadron_id: 'sqn1'},
            {service_no: 'TR1', name: 'Bob Trainee', squadron_id: 'sqn1'},
        ]);
    });

    it('exports log correctly and populates header, DI, and sign-ons', async () => {
        const mockState: WinchLogState = {
            squadron: 'sqn1',
            winchId: 1,
            operatorSn: 'OP1',
            traineeSn: null,
            dayFinished: true,
            activeLauncherSn: 'OP1',
            leftHistory: [
                {
                    id: 1,
                    launch_number: 16,
                    burn: false,
                    remark: 'Normal launch',
                    operator_sn: 'OP1',
                    timestamp: '2026-09-09T10:00:00Z'
                },
                {
                    id: 2,
                    launch_number: null,
                    burn: true,
                    remark: 'Repair: Cable splice | Worker: OP1 | Sup: OP2, Burned cable',
                    operator_sn: 'OP1',
                    timestamp: '2026-09-09T10:30:00Z'
                }
            ],
            rightHistory: [
                {
                    id: 3,
                    launch_number: 26,
                    burn: false,
                    remark: null,
                    operator_sn: 'OP2',
                    timestamp: '2026-09-09T10:15:00Z'
                }
            ],
        };

        await exportLog(mockState);

        expect(mockExcelCells['F2'].value).toBe('sqn1');
        expect(mockExcelCells['E4'].value).toBe(1);
        expect(mockExcelCells['E5'].value).toBe('REG123');
        expect(mockExcelCells['I6'].value).toBe(105);
        expect(mockExcelCells['I7'].value).toBe(110);
        expect(mockExcelCells['D12'].value).toBe('John Doe');
        expect(mockExcelCells['F12'].value).toBe('John Doe');
        expect(mockExcelCells['H12'].value).toBe('Jane Smith');
        expect(mockExcelCells['J12'].value).toBe('John Doe');
        expect(mockExcelCells['D9'].value).toBe(15);
        expect(mockExcelCells['E9'].value).toBe(25);

        expect(mockExcelCells['D14'].value).toBe(16);
        expect(mockExcelCells['E14'].value).toBe(26);
        expect(mockExcelCells['D15'].value).toBe(16);
        expect(mockExcelCells['E15'].value).toBe(26);

        expect(mockExcelCells['F31'].value).toBe('John Doe VS Bob Trainee');
        expect(mockExcelCells['K31'].value).toBe('John Doe');

        expect(fileSaver.saveAs).toHaveBeenCalled();
    });

    it('throws error when winchId is null', async () => {
        const mockState: WinchLogState = {
            squadron: 'sqn1',
            winchId: null,
            operatorSn: 'OP1',
            traineeSn: null,
            dayFinished: false,
            activeLauncherSn: 'OP1',
            leftHistory: [],
            rightHistory: [],
        };
        await expect(exportLog(mockState)).rejects.toThrow('No winch selected');
    });

    it('throws custom error if export process fails', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
        const mockState: WinchLogState = {
            squadron: 'sqn1',
            winchId: 1,
            operatorSn: 'OP1',
            traineeSn: null,
            dayFinished: false,
            activeLauncherSn: 'OP1',
            leftHistory: [],
            rightHistory: [],
        };
        await expect(exportLog(mockState)).rejects.toThrow('Log export failed. Please check your connection and try again.');
    });

    it('exports log correctly when histories are empty and handles unknown operators', async () => {
        const mockState: WinchLogState = {
            squadron: 'sqn1',
            winchId: 1,
            operatorSn: 'OP1',
            traineeSn: null,
            dayFinished: false,
            activeLauncherSn: 'OP1',
            leftHistory: [],
            rightHistory: [],
        };

        vi.mocked(getDayLog).mockResolvedValueOnce([
            {
                id: 1,
                winch_id: 1,
                squadron_id: 'sqn1',
                cable_check: null,
                hours: null,
                type: 'sign_on',
                operator_sn: 'UNKNOWN_OP',
                trainee: null,
                timestamp: '2026-09-09T08:00:00Z'
            },
        ]);

        await exportLog(mockState);

        expect(fileSaver.saveAs).toHaveBeenCalled();
    });

    it('handles null brought forward when all launch numbers are null', async () => {
        const mockState: WinchLogState = {
            squadron: 'sqn1',
            winchId: 1,
            operatorSn: 'OP1',
            traineeSn: null,
            dayFinished: false,
            activeLauncherSn: 'OP1',
            leftHistory: [
                {
                    id: 1,
                    launch_number: null,
                    burn: true,
                    remark: null,
                    operator_sn: 'OP1',
                    timestamp: '2026-09-16T10:00:00Z'
                },
            ],
            rightHistory: [
                {
                    id: 2,
                    launch_number: null,
                    burn: true,
                    remark: null,
                    operator_sn: 'OP1',
                    timestamp: '2026-09-16T10:05:00Z'
                },
            ],
        };

        await exportLog(mockState);

        expect(fileSaver.saveAs).toHaveBeenCalled();
    });

    it('exports log correctly from ExportDataResponse using exportLogFromData or exportLog', async () => {
        const mockExportData: ExportDataResponse = {
            winch: { id: 5, registration: 'REG555', squadron_id: '621 VGS' },
            logs: [
                {
                    id: 10,
                    squadron_id: '621 VGS',
                    winch_id: 5,
                    type: 'di',
                    timestamp: '2026-09-19T08:00:00Z',
                    operator_sn: 'OP1',
                    hours: 200,
                },
                {
                    id: 11,
                    squadron_id: '621 VGS',
                    winch_id: 5,
                    type: 'finish_day',
                    timestamp: '2026-09-19T18:00:00Z',
                    operator_sn: 'OP1',
                    cable_check: 'OP2',
                    hours: 205,
                },
            ],
            launches: [
                {
                    launch_id: 101,
                    launch_number: 1,
                    squadron_id: '621 VGS',
                    winch_id: 5,
                    drum: 'left',
                    timestamp: '2026-09-19T09:00:00Z',
                    operator_sn: 'OP1',
                    remarks: 'Left launch',
                },
                {
                    launch_id: 102,
                    launch_number: 2,
                    squadron_id: '621 VGS',
                    winch_id: 5,
                    drum: 'right',
                    timestamp: '2026-09-19T09:10:00Z',
                    operator_sn: 'OP2',
                    remarks: null,
                },
            ],
            operators: [
                { service_no: 'OP1', name: 'John Doe', squadron_id: '621 VGS' },
                { service_no: 'OP2', name: 'Jane Smith', squadron_id: '621 VGS' },
            ],
            brought_forward: { left: 50, right: 60 },
        };

        await exportLogFromData(mockExportData, '2026-09-19');

        expect(mockExcelCells['F2'].value).toBe('621 VGS');
        expect(mockExcelCells['E4'].value).toBe(5);
        expect(mockExcelCells['E5'].value).toBe('REG555');
        expect(mockExcelCells['I6'].value).toBe(200);
        expect(mockExcelCells['I7'].value).toBe(205);
        expect(mockExcelCells['D9'].value).toBe(50);
        expect(mockExcelCells['E9'].value).toBe(60);
        expect(mockExcelCells['D14'].value).toBe(1);
        expect(mockExcelCells['E14'].value).toBe(2);
        expect(fileSaver.saveAs).toHaveBeenCalled();

        // Verify MIME type on generated Blob
        const savedBlob = vi.mocked(fileSaver.saveAs).mock.calls[0][0] as Blob;
        expect(savedBlob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Also test passing ExportDataResponse directly to exportLog
        vi.mocked(fileSaver.saveAs).mockClear();
        await exportLog(mockExportData, '2026-09-19');
        expect(fileSaver.saveAs).toHaveBeenCalled();
    });

    it('handles ExportDataResponse with nullish logs, operators, and launches gracefully', async () => {
        const minimalExportData = {
            winch: { id: 7, registration: 'W7', squadron_id: '621 VGS' },
            brought_forward: { left: null, right: null },
        } as unknown as ExportDataResponse;

        await exportLogFromData(minimalExportData, '2026-09-19');
        expect(fileSaver.saveAs).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            'winch_log_2026-09-19.xlsx'
        );
    });
});
