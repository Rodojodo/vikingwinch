import {beforeEach, describe, expect, it, vi} from 'vitest';
import {exportLog, type WinchLogState} from './exportLog.ts';
import * as fileSaver from 'file-saver';
import {getDayLog} from '../../features/day-ops/api/dayOpsClient.ts';
import {getBroughtForward, getWinch} from '../../features/winch-ops/api/winchClient.ts';
import {getOperatorsForSquadron} from '../../core/http/operatorsClient.ts';

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
        vi.stubGlobal('fetch', vi.fn());
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
                hours: null,
                type: 'sign_on',
                operator_sn: 'OP2',
                trainee: null,
                timestamp: '2026-09-09T09:00:00Z'
            },
        ]);
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            {service_no: 'OP1', name: 'Operator One', squadron_id: 'sqn1'},
            {service_no: 'OP2', name: 'Operator Two', squadron_id: 'sqn1'},
            {service_no: 'TR1', name: 'Trainee One', squadron_id: 'sqn1'},
        ]);

        const mockArrayBuffer = new ArrayBuffer(8);
        vi.mocked(fetch).mockResolvedValue(new Response(mockArrayBuffer));
    });

    it('exports log correctly', async () => {
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
                    launch_number: 10,
                    burn: false,
                    remark: 'Repair: Engine fixed | Worker: OP1 | Sup: OP2, Test left',
                    operator_sn: 'OP1',
                    timestamp: '2026-09-16T10:00:00Z'
                },
                {
                    id: 2,
                    launch_number: null,
                    burn: true,
                    remark: null,
                    operator_sn: 'OP1',
                    timestamp: '2026-09-16T10:10:00Z'
                },
            ],
            rightHistory: [
                {
                    id: 3,
                    launch_number: 20,
                    burn: false,
                    remark: 'D2 Test',
                    operator_sn: 'OP2',
                    timestamp: '2026-09-16T10:05:00Z'
                },
                {
                    id: 4,
                    launch_number: null,
                    burn: true,
                    remark: null,
                    operator_sn: 'OP2',
                    timestamp: '2026-09-16T10:15:00Z'
                },
            ],
        };

        await exportLog(mockState);

        expect(fileSaver.saveAs).toHaveBeenCalled();
        const blobArg = vi.mocked(fileSaver.saveAs).mock.calls[0][0];
        expect(blobArg).toBeInstanceOf(Blob);

        expect(mockExcelCells['D9'].value).toBe(15);
        expect(mockExcelCells['E9'].value).toBe(25);
        expect(mockExcelCells['G14'].value).toContain('OO');
        expect(mockExcelCells['G14'].value).toContain('OT');
        expect(mockExcelCells['H14'].value).toContain('Repair: Engine fixed');
        expect(mockExcelCells['K14'].value).toContain('Operator One');
        expect(mockExcelCells['L14'].value).toContain('Operator Two');
    });

    it('throws error if winchId is null', async () => {
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
});
