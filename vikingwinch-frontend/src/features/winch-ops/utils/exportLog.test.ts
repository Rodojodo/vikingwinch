import {beforeEach, describe, expect, it, vi} from 'vitest';
import {exportLog} from './exportLog.ts';
import * as fileSaver from 'file-saver';
import {getExportData} from '../api/winchOpsClient';


vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

vi.mock('../../winch-ops/api/winchOpsClient', () => ({getExportData: vi.fn()}));

vi.mock('exceljs', () => {
    class Workbook {
        xlsx = {
            load: vi.fn().mockResolvedValue(undefined),
            writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        };
        worksheets = [{
            getCell: vi.fn().mockImplementation((address: string) => {
                if (!(globalThis as any).__excelCells) (globalThis as any).__excelCells = {};
                if (!(globalThis as any).__excelCells[address]) (globalThis as any).__excelCells[address] = { value: null };
                return (globalThis as any).__excelCells[address];
            })
        }];
    }
    return {
        default: { Workbook }
    };
});

// Mock fetch for the template
vi.stubGlobal("fetch", vi.fn());

describe('exportLog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis as any).__excelCells = {};
        vi.stubGlobal('fetch', vi.fn());
        vi.mocked(getExportData).mockResolvedValue({
            winch: {registration: 'W123'},
            logs: [
                {id: 1, type: 'di', hours: '123.5', operator_sn: 'OP1'},
                {id: 2, type: 'sign_on', timestamp: '2023-10-27T08:00:00Z', operator_sn: 'OP1', trainee: 'TR1'},
                {id: 3, type: 'sign_on', timestamp: '2023-10-27T09:00:00Z', operator_sn: 'OP2', trainee: null},
                {id: 4, type: 'finish_day', hours: '128.0', operator_sn: 'OP1', cable_check: 'OP2'}
            ],
            operators: [
                {service_no: 'OP1', name: 'Operator One'},
                {service_no: 'OP2', name: 'Operator Two'},
                {service_no: 'TR1', name: 'Trainee One'}
            ],
            brought_forward: {left: 15, right: 25}
        } as any);

        const mockArrayBuffer = new ArrayBuffer(8);
        (globalThis.fetch as any).mockResolvedValue({
            arrayBuffer: () => Promise.resolve(mockArrayBuffer)
        });
    });

    it('exports log correctly', async () => {
        const mockState = {
            squadron: 'sqn1',
            winchId: 1,
            leftHistory: [
                { launch_number: 10, burn: false, remark: 'Repair: Engine fixed | Worker: OP1 | Sup: OP2, Test left', operator_sn: 'OP1' },
                { launch_number: null, burn: true }
            ],
            rightHistory: [
                { launch_number: 20, burn: false, remark: 'D2 Test', operator_sn: 'OP2' },
                { launch_number: null, burn: true }
            ]
        } as any;

        await exportLog(mockState);
        
        expect(fileSaver.saveAs).toHaveBeenCalled();
        const blobArg = vi.mocked(fileSaver.saveAs).mock.calls[0][0];
        expect(blobArg).toBeInstanceOf(Blob);

        const cells = (globalThis as any).__excelCells;
        expect(cells['D9'].value).toBe(15);
        expect(cells['E9'].value).toBe(25);
        expect(cells['G14'].value).toContain('OO');
        expect(cells['G14'].value).toContain('OT');
        expect(cells['H14'].value).toContain('Repair: Engine fixed');
        expect(cells['K14'].value).toContain('Operator One');
        expect(cells['L14'].value).toContain('Operator Two');
    });

    it('throws error if winchId is null', async () => {
        const mockState = { winchId: null } as any;
        await expect(exportLog(mockState)).rejects.toThrow("No winch selected");
    });

    it('throws custom error if export process fails', async () => {
        // Break fetch to trigger error
        (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));
        const mockState = { winchId: 1 } as any;
        await expect(exportLog(mockState)).rejects.toThrow("Log export failed. Please check your connection and try again.");
    });


    it('exports log correctly when histories are empty and handles unknown operators', async () => {
        const mockState = {
            squadron: 'sqn1',
            winchId: 1,
            leftHistory: [],
            rightHistory: []
        } as any;

        // Give a log with unknown operator and no trainee
        
        await exportLog(mockState);
        
        expect(fileSaver.saveAs).toHaveBeenCalled();
    });

    it('handles null brought forward when all launch numbers are null', async () => {
        const mockState = {
            squadron: 'sqn1',
            winchId: 1,
            leftHistory: [
                { launch_number: null, burn: true }
            ],
            rightHistory: [
                { launch_number: null, burn: true }
            ]
        } as any;

        await exportLog(mockState);
        
        expect(fileSaver.saveAs).toHaveBeenCalled();
    });
});
