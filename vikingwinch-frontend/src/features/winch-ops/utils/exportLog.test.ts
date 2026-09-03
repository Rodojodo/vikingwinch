import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportLog } from './exportLog.ts';
import * as fileSaver from 'file-saver';
import { getWinch, getDayLog, getOperatorsForSquadron } from '../api/dataClient.ts';

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

vi.mock('../api/dataClient', () => ({
    getWinch: vi.fn(),
    getDayLog: vi.fn(),
    getOperatorsForSquadron: vi.fn(),
}));

vi.mock('exceljs', () => {
    class Workbook {
        xlsx = {
            load: vi.fn().mockResolvedValue(undefined),
            writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        };
        worksheets = [{
            getCell: vi.fn().mockReturnValue({ value: null })
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
        vi.stubGlobal('fetch', vi.fn());
        vi.mocked(getWinch).mockResolvedValue({ registration: 'REG123' });
        vi.mocked(getDayLog).mockResolvedValue([
            { type: 'sign_on', operator_id: 'OP1', trainee: 'TR1' } as any,
            { type: 'sign_on', operator_id: 'OP2', trainee: null } as any
        ]);
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { sn: 'OP1', name: 'Operator One', squadron_id: 'sqn1' },
            { sn: 'OP2', name: 'Operator Two', squadron_id: 'sqn1' },
            { sn: 'TR1', name: 'Trainee One', squadron_id: 'sqn1' }
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
                { launch_number: 10, burn: false },
                { launch_number: null, burn: true }
            ],
            rightHistory: [
                { launch_number: 20, burn: false },
                { launch_number: null, burn: true }
            ]
        } as any;

        // Mock exceljs inside to avoid actual heavy parsing
        // wait, we can just run it since vitest has node access if it's not purely jsdom or if exceljs works in jsdom
        // exceljs works in jsdom
        await exportLog(mockState, 5.5);
        
        expect(fileSaver.saveAs).toHaveBeenCalled();
        const blobArg = vi.mocked(fileSaver.saveAs).mock.calls[0][0];
        expect(blobArg).toBeInstanceOf(Blob);
    });

    it('throws error if winchId is null', async () => {
        const mockState = { winchId: null } as any;
        await expect(exportLog(mockState, 5.5)).rejects.toThrow("No winch selected");
    });

    it('throws custom error if export process fails', async () => {
        const mockState = { winchId: 1 } as any;
        await expect(exportLog(mockState, 5.5)).rejects.toThrow("Log export failed. Please check your connection and try again.");
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
            { type: 'sign_on', operator_id: 'UNKNOWN_OP', trainee: null } as any
        ]);
        
        await exportLog(mockState, 5.5);
        
        expect(fileSaver.saveAs).toHaveBeenCalled();
    });

    it('handles null hours and brought forward when all launch numbers are null', async () => {
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

        // pass hours as null
        await exportLog(mockState, null);
        
        expect(fileSaver.saveAs).toHaveBeenCalled();
    });
});
