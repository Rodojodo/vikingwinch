import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';
import winchLogTemplateUrl from '../../assets/winch_log.xltx?url';
import type {LaunchRecord} from '../../features/launch-ops/types';
import type {ExportDataResponse} from '../../features/winch-ops/types';
import type {OperatorRead} from '../../core/types';

interface BuildLogOptions {
    squadron: string;
    winchId: number;
    registration?: string;
    date: Date;
    todayStr: string;
    dayLogs: Array<{
        type: string;
        operator_sn: string;
        trainee?: string | null;
        cable_check?: string | null;
        hours?: number | null;
        timestamp?: string | null;
    }>;
    operators: OperatorRead[];
    broughtForward: { left: number | null; right: number | null };
    leftHistory: LaunchRecord[];
    rightHistory: LaunchRecord[];
}

const CELLS = {
    UNIT: 'F2',
    WINCH_ID: 'E4',
    REGISTRATION: 'E5',
    DATE: 'E6',
    DI_HOURS: 'I6',
    FINISH_HOURS: 'I7',
    BF_LEFT: 'D9',
    BF_RIGHT: 'E9',
    OPERATOR_START_ROW: 31,
};

const formatUKTime = (timestampStr: string): string => {
    const d = new Date(timestampStr);
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(d);
};

export const getTodayDateString = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildWinchLogWorkbook = async (options: BuildLogOptions): Promise<void> => {
    const {
        squadron,
        winchId,
        registration,
        date,
        todayStr,
        dayLogs = [],
        operators = [],
        broughtForward,
        leftHistory,
        rightHistory,
    } = options;

    const opMap = new Map(operators.map(op => [op.service_no, op.name]));
    const getName = (sn?: string | null) => sn ? (opMap.get(sn) || sn) : null;

    const response = await fetch(winchLogTemplateUrl);
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.worksheets[0];

    sheet.getCell(CELLS.UNIT).value = squadron;
    sheet.getCell(CELLS.WINCH_ID).value = winchId;
    sheet.getCell(CELLS.REGISTRATION).value = registration ?? '';
    sheet.getCell(CELLS.DATE).value = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

    const diLog = dayLogs.find(log => log.type === 'di');
    const finishLog = dayLogs.find(log => log.type === 'finish_day');

    sheet.getCell(CELLS.DI_HOURS).value = diLog?.hours ?? '';
    sheet.getCell(CELLS.FINISH_HOURS).value = finishLog?.hours ?? '';

    if (diLog) {
        sheet.getCell('D12').value = getName(diLog.operator_sn);
        sheet.getCell('F12').value = getName(diLog.operator_sn);
    }

    if (finishLog) {
        sheet.getCell('H12').value = getName(finishLog.cable_check);
        sheet.getCell('J12').value = getName(finishLog.operator_sn);
    }

    sheet.getCell(CELLS.BF_LEFT).value = broughtForward.left ?? '';
    sheet.getCell(CELLS.BF_RIGHT).value = broughtForward.right ?? '';

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    let lastLeftNumber: number | string = broughtForward.left ?? 0;
    let lastRightNumber: number | string = broughtForward.right ?? 0;
    const seenOperators = new Set<string>();

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

        const sheetIndex = i < 15 ? 0 : 1 + Math.floor((i - 15) / 20);
        const currentSheet = workbook.worksheets[sheetIndex];

        if (!currentSheet) break;

        let currentRow: number;
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

        const toolCheckInitials = new Set<string>();
        const remarksCombined: string[] = [];
        const repairsCombined: string[] = [];
        const supervisorsCombined: string[] = [];

        const processRemark = (drumStr: string, remarkStr: string | null) => {
            if (!remarkStr) return;
            let text = remarkStr;
            const repairRegex = /(?:^|, )Repair: (.*?) \| Worker: (.*?) \| Sup: (.*?)(?=, |$)/g;
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
        const traineeName = getName(log.trainee ?? null);

        let cellValue = operatorName;
        if (traineeName) {
            cellValue = `${operatorName} VS ${traineeName}`;
        }

        sheet.getCell(`F${CELLS.OPERATOR_START_ROW + i}`).value = cellValue;
        if (log.timestamp) {
            sheet.getCell(`I${CELLS.OPERATOR_START_ROW + i}`).value = formatUKTime(log.timestamp);
        }
        sheet.getCell(`K${CELLS.OPERATOR_START_ROW + i}`).value = operatorName;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `winch_log_${todayStr}.xlsx`);
};

export const exportLog = async (
    data: ExportDataResponse,
    dateStr?: string
): Promise<void> => {
    if (!data?.winch?.id) {
        throw new Error('No winch selected');
    }

    try {
        const today = new Date();
        const todayStr = dateStr ?? getTodayDateString(today);

        let targetDate = today;
        if (dateStr) {
            const [y, m, d] = dateStr.split('-').map(Number);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                targetDate = new Date(y, m - 1, d);
            }
        }

        const leftHistory: LaunchRecord[] = [];
        const rightHistory: LaunchRecord[] = [];
        for (const launch of data.launches || []) {
            const record: LaunchRecord = {
                id: launch.launch_id,
                launch_number: launch.launch_number,
                timestamp: launch.timestamp,
                remark: launch.remarks ?? null,
                burn: launch.launch_number === null,
                operator_sn: launch.operator_sn,
            };
            if (launch.drum === 'left') {
                leftHistory.push(record);
            } else {
                rightHistory.push(record);
            }
        }

        await buildWinchLogWorkbook({
            squadron: data.winch.squadron_id,
            winchId: data.winch.id,
            registration: data.winch.registration,
            date: targetDate,
            todayStr,
            dayLogs: data.logs ?? [],
            operators: data.operators ?? [],
            broughtForward: data.brought_forward,
            leftHistory,
            rightHistory,
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'No winch selected') {
            throw error;
        }
        console.error('Failed to generate winch log spreadsheet:', error);
        throw new Error('Log export failed. Please check your connection and try again.');
    }
};

export const exportLogFromData = exportLog;
