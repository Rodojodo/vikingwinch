import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import winchLogTemplateUrl from '../../../assets/winch_log.xltx?url';
import type { WinchLogState } from '../types';
import { getWinch, getDayLog, getOperatorsForSquadron } from '../api/dataClient.ts';


const CELLS = {
    UNIT: 'F2',
    WINCH_ID: 'E4',
    REGISTRATION: 'E5',
    DATE: 'E6',
    HOURS: 'I7',
    BF_LEFT: 'D9',
    BF_RIGHT: 'E9',
    LAUNCH_START_ROW: 14,
    OPERATOR_START_ROW: 31,
};

export const exportLog = async (state: WinchLogState, hours: number | null): Promise<void> => {
    try {
        // Fetch external data concurrently
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const [winch, dayLogs, operators] = await Promise.all([
            getWinch(state.winchId),
            getDayLog(state.winchId, todayStr),
            getOperatorsForSquadron(state.squadron)
        ]);

        const opMap = new Map(operators.map(op => [op.sn, op.name]));
        const getName = (sn: string | null) => sn ? (opMap.get(sn) || sn) : null;

        // Fetch template
        const response = await fetch(winchLogTemplateUrl);
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const sheet = workbook.worksheets[0];

        // Basic Info
        sheet.getCell(CELLS.UNIT).value = state.squadron; // Unit
        sheet.getCell(CELLS.WINCH_ID).value = state.winchId;
        sheet.getCell(CELLS.REGISTRATION).value = winch.registration;
        sheet.getCell(CELLS.DATE).value = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        // Assuming we have these in state
        if (hours !== null) {
            sheet.getCell(CELLS.HOURS).value = hours;
        }

        const leftHistory = state.leftHistory;
        const rightHistory = state.rightHistory;

        // B/F
        const getBroughtForward = (history: any[]) => {
            const firstValid = history.find(h => h.launch_number !== null);
            return firstValid ? firstValid.launch_number - 1 : '';
        };

        if (leftHistory.length > 0) {
            sheet.getCell(CELLS.BF_LEFT).value = getBroughtForward(leftHistory);
        }
        if (rightHistory.length > 0) {
            sheet.getCell(CELLS.BF_RIGHT).value = getBroughtForward(rightHistory);
        }

        // Populate D14..D28 and E14..E28
        for (let i = 0; i < 15; i++) {
            const leftLaunch = leftHistory[i];
            const rightLaunch = rightHistory[i];

            const leftCell = sheet.getCell(`D${CELLS.LAUNCH_START_ROW + i}`);
            const rightCell = sheet.getCell(`E${CELLS.LAUNCH_START_ROW + i}`);

            if (leftLaunch) {
                if (leftLaunch.launch_number == null && leftLaunch.burn) {
                    leftCell.value = '---';
                } else {
                    leftCell.value = leftLaunch.launch_number;
                }
            } else {
                leftCell.value = null; // Blank
            }

            if (rightLaunch) {
                if (rightLaunch.launch_number == null && rightLaunch.burn) {
                    rightCell.value = '---';
                } else {
                    rightCell.value = rightLaunch.launch_number;
                }
            } else {
                rightCell.value = null;
            }
        }

        // Populate Operators (F31, F32, etc.)
        const signOns = dayLogs.filter(log => log.type === 'sign_on');
        for (let i = 0; i < Math.min(signOns.length, 5); i++) {
            const log = signOns[i];
            const operatorName = getName(log.operator_id);
            const traineeName = getName(log.trainee);

            let cellValue = operatorName;
            if (traineeName) {
                cellValue = `${operatorName} VS ${traineeName}`;
            }

            sheet.getCell(`F${CELLS.OPERATOR_START_ROW + i}`).value = cellValue;
        }

        // Generate output file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `winch_log_${todayStr}.xlsx`);
    } catch (error) {
        console.error("Failed to generate winch log spreadsheet:", error);
        throw new Error("Log export failed. Please check your connection and try again.");
    }

};
