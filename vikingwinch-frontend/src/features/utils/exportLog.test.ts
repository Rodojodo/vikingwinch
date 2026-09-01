import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportLog } from './exportLog';
import * as fileSaver from 'file-saver';
import { getWinch, getDayLog, getOperatorsForSquadron } from '../api/dataClient';

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
global.fetch = vi.fn();

describe('exportLog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getWinch).mockResolvedValue({ registration: 'REG123' });
        vi.mocked(getDayLog).mockResolvedValue([
            { type: 'sign_on', operator_id: 'OP1', trainee: 'TR1' },
            { type: 'sign_on', operator_id: 'OP2', trainee: null }
        ]);
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([
            { sn: 'OP1', name: 'Operator One' },
            { sn: 'OP2', name: 'Operator Two' },
            { sn: 'TR1', name: 'Trainee One' }
        ]);
        
        const mockArrayBuffer = new ArrayBuffer(8);
        (global.fetch as any).mockResolvedValue({
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
                { launch_number: 20, burn: false }
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
});
