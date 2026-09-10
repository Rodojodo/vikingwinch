import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import winchLogTemplateUrl from '../../../assets/winch_log.xltx?url';
import type { WinchLogState } from '../types';
import { getWinch, getDayLog, getOperatorsForSquadron, getBroughtForward } from '../api/dataClient.ts';

const CELLS = {
    UNIT: 'F2',
    WINCH_ID: 'E4',
    REGISTRATION: 'E5',
    DATE: 'E6',
    DI_HOURS: 'I6',
    FINISH_HOURS: 'I7',
    BF_LEFT: 'D9',
    BF_RIGHT: 'E9',
    LAUNCH_START_ROW: 14,
    OPERATOR_START_ROW: 31,
};


const formatUKTime = (timestampStr: string): string => {
    // Append Z to parse the naive database timestamp as UTC
    const d = new Date(timestampStr.endsWith('Z') ? timestampStr : timestampStr + 'Z');
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(d);
};

export const exportLog = async (state: WinchLogState): Promise<void> => {
    if (!state.winchId) throw new Error("No winch selected");
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const [winch, dayLogs, operators, bf] = await Promise.all([
            getWinch(state.winchId),
            getDayLog(state.winchId, todayStr),
            getOperatorsForSquadron(state.squadron),
            getBroughtForward(state.winchId, todayStr)
        ]);

        const opMap = new Map(operators.map(op => [op.service_no, op.name]));
        const getName = (sn: string | null) => sn ? (opMap.get(sn) || sn) : null;

        const response = await fetch(winchLogTemplateUrl);
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const sheet = workbook.worksheets[0];

        sheet.getCell(CELLS.UNIT).value = state.squadron;
        sheet.getCell(CELLS.WINCH_ID).value = state.winchId;
        sheet.getCell(CELLS.REGISTRATION).value = winch.registration;
        sheet.getCell(CELLS.DATE).value = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        const diLog = dayLogs.find(log => log.type === 'di');
        const finishLog = dayLogs.find(log => log.type === 'finish_day');

        sheet.getCell(CELLS.DI_HOURS).value = diLog?.hours ?? '';
        sheet.getCell(CELLS.FINISH_HOURS).value = finishLog?.hours ?? '';

        if (diLog) {
            sheet.getCell('D12').value = getName(diLog.operator_sn);
            sheet.getCell('F12').value = getName(diLog.operator_sn); // Signature is just the name for now
        }

        if (finishLog) {
            sheet.getCell('H12').value = getName(finishLog.operator_sn);
            sheet.getCell('J12').value = getName(finishLog.operator_sn); // Signature is just the name for now
        }

        const leftHistory = state.leftHistory;
        const rightHistory = state.rightHistory;

        sheet.getCell(CELLS.BF_LEFT).value = bf.left ?? '';
        sheet.getCell(CELLS.BF_RIGHT).value = bf.right ?? '';

        const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

        let lastLeftNumber: number | string = bf.left ?? 0;
        let lastRightNumber: number | string = bf.right ?? 0;
        let seenOperators = new Set<string>();

        const maxLaunches = Math.max(15, leftHistory.length, rightHistory.length);
        const totalSheetsNeeded = maxLaunches <= 15 ? 1 : 1 + Math.ceil((maxLaunches - 15) / 20);
        const totalSheetsAvailable = workbook.worksheets.length;
        const totalSheets = Math.min(totalSheetsNeeded, totalSheetsAvailable);
        
        for (let s = 0; s < totalSheets; s++) {
            workbook.worksheets[s].getCell('K2').value = totalSheets;
        }

        const totalRows = Math.min(15 + (totalSheetsAvailable - 1) * 20, maxLaunches);

        for (let i = 0; i < totalRows; i++) {
            const leftLaunch = leftHistory[i];
            const rightLaunch = rightHistory[i];

            let sheetIndex = i < 15 ? 0 : 1 + Math.floor((i - 15) / 20);
            let currentSheet = workbook.worksheets[sheetIndex];
            
            if (!currentSheet) break;

            let currentRow;
            if (sheetIndex === 0) {
                currentRow = 14 + i;
            } else {
                currentRow = 8 + ((i - 15) % 20);
                
                if (currentRow === 8) {
                    currentSheet.getCell('D3').value = lastLeftNumber;
                    currentSheet.getCell('E3').value = lastRightNumber;
                }
            }

            const leftCell = currentSheet.getCell(`D${currentRow}`);
            const rightCell = currentSheet.getCell(`E${currentRow}`);
            const initialsCell = currentSheet.getCell(`G${currentRow}`);
            const remarksCell = currentSheet.getCell(`H${currentRow}`);
            const repairsCell = currentSheet.getCell(`K${currentRow}`);
            const supervisorCell = currentSheet.getCell(`L${currentRow}`);
            const toolCheckCell = currentSheet.getCell(`M${currentRow}`);

            let leftOp = null;
            let rightOp = null;
            
            let toolCheckInitials = new Set<string>();
            let remarksCombined: string[] = [];
            let repairsCombined: string[] = [];
            let supervisorsCombined: string[] = [];

            const processRemark = (drumStr: string, remarkStr: string | null) => {
                if (!remarkStr) return;
                let text = remarkStr;
                const repairRegex = /(?:^|, )Repair: (.*?) \| Worker: (.*?) \| Sup: (.*?)(?=(?:, |$))/g;
                let match;
                while ((match = repairRegex.exec(text)) !== null) {
                    const repairDetail = match[1].trim();
                    const workerName = getName(match[2].trim()) || match[2].trim();
                    const supervisorName = getName(match[3].trim()) || match[3].trim();
                    
                    remarksCombined.push(`${drumStr}: Repair: ${repairDetail}`);
                    repairsCombined.push(workerName);
                    supervisorsCombined.push(supervisorName);
                    toolCheckInitials.add(getInitials(workerName));
                }
                text = text.replace(repairRegex, '').trim();
                text = text.replace(/^,|,$/g, '').trim();
                if (text) {
                    remarksCombined.push(`${drumStr}: ${text}`);
                }
            };

            if (leftLaunch) {
                if (leftLaunch.launch_number == null && leftLaunch.burn) {
                    leftCell.value = lastLeftNumber;
                } else {
                    leftCell.value = leftLaunch.launch_number;
                    if (typeof leftLaunch.launch_number === 'number') {
                        lastLeftNumber = leftLaunch.launch_number;
                    }
                }
                leftOp = leftLaunch.operator_sn ? getName(leftLaunch.operator_sn) : null;
                if (leftLaunch.operator_sn && !seenOperators.has(leftLaunch.operator_sn)) {
                    seenOperators.add(leftLaunch.operator_sn);
                    if (leftOp) toolCheckInitials.add(getInitials(leftOp));
                }
                processRemark('D1', leftLaunch.remark);
            } else {
                leftCell.value = rightLaunch ? lastLeftNumber : null;
            }

            if (rightLaunch) {
                if (rightLaunch.launch_number == null && rightLaunch.burn) {
                    rightCell.value = lastRightNumber;
                } else {
                    rightCell.value = rightLaunch.launch_number;
                    if (typeof rightLaunch.launch_number === 'number') {
                        lastRightNumber = rightLaunch.launch_number;
                    }
                }
                rightOp = rightLaunch.operator_sn ? getName(rightLaunch.operator_sn) : null;
                if (rightLaunch.operator_sn && !seenOperators.has(rightLaunch.operator_sn)) {
                    seenOperators.add(rightLaunch.operator_sn);
                    if (rightOp) toolCheckInitials.add(getInitials(rightOp));
                }
                processRemark('D2', rightLaunch.remark);
            } else {
                rightCell.value = leftLaunch ? lastRightNumber : null;
            }

            const initials = new Set<string>();
            if (leftOp) initials.add(getInitials(leftOp));
            if (rightOp) initials.add(getInitials(rightOp));
            initialsCell.value = Array.from(initials).join(' / ') || null;

            remarksCell.value = remarksCombined.join(' | ') || null;
            repairsCell.value = repairsCombined.join(' | ') || null;
            supervisorCell.value = supervisorsCombined.join(' / ') || null;
            toolCheckCell.value = Array.from(toolCheckInitials).join(' / ') || null;
        }

        const finalLeft = typeof lastLeftNumber === 'number' ? lastLeftNumber : parseInt(String(lastLeftNumber)) || 0;
        const finalRight = typeof lastRightNumber === 'number' ? lastRightNumber : parseInt(String(lastRightNumber)) || 0;
        workbook.worksheets[0].getCell('L8').value = finalLeft + finalRight;

        const signOns = dayLogs.filter(log => log.type === 'sign_on');
        for (let i = 0; i < Math.min(signOns.length, 5); i++) {
            const log = signOns[i];
            const operatorName = getName(log.operator_sn);
            const traineeName = getName(log.trainee);

            let cellValue = operatorName;
            if (traineeName) {
                cellValue = `${operatorName} VS ${traineeName}`;
            }

            sheet.getCell(`F${CELLS.OPERATOR_START_ROW + i}`).value = cellValue;
            if (log.timestamp) {
                sheet.getCell(`I${CELLS.OPERATOR_START_ROW + i}`).value = formatUKTime(log.timestamp);
            }
            sheet.getCell(`K${CELLS.OPERATOR_START_ROW + i}`).value = cellValue;
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `winch_log_${todayStr}.xlsx`);
    } catch (error) {
        console.error("Failed to generate winch log spreadsheet:", error);
        throw new Error("Log export failed. Please check your connection and try again.");
    }
};
