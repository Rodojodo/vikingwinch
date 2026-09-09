import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportLog } from './exportLog.ts';
import * as fileSaver from 'file-saver';
import { getWinch, getDayLog, getOperatorsForSquadron, getBroughtForward } from '../api/dataClient.ts';

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

vi.mock('../api/dataClient', () => ({
    getWinch: vi.fn(),
    getDayLog: vi.fn(),
    getOperatorsForSquadron: vi.fn(),
    getBroughtForward: vi.fn(),
}));

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
        vi.mocked(getWinch).mockResolvedValue({ registration: 'REG123' } as any);
        vi.mocked(getBroughtForward).mockResolvedValue({ left: 15, right: 25 });
        vi.mocked(getDayLog).mockResolvedValue([
            { type: 'sign_on', operator_sn: 'OP1', trainee: 'TR1', timestamp: '2026-09-09T08:00:00Z' } as any,
            { type: 'sign_on', operator_sn: 'OP2', trainee: null, timestamp: '2026-09-09T09:00:00Z' } as any
        ]);
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { service_no: 'OP1', name: 'Operator One', squadron_id: 'sqn1' } as any,
            { service_no: 'OP2', name: 'Operator Two', squadron_id: 'sqn1' } as any,
            { service_no: 'TR1', name: 'Trainee One', squadron_id: 'sqn1' } as any
        ]);

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
                { launch_number: 10, burn: false, remark: 'Repair: Engine fixed S_id: OP2, Test left', operator_sn: 'OP1' },
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
        expect(cells['K14'].value).toContain('Engine fixed');
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
        vi.mocked(getDayLog).mockResolvedValueOnce([
            { type: 'sign_on', operator_sn: 'UNKNOWN_OP', trainee: null } as any
        ]);
        
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
