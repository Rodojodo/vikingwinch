import type {LaunchResponse} from '../../launch-ops/types/launchOpsTypes';
import type {DayLogResponse} from '../../day-ops/types/dayOpsTypes';
import type {OperatorRead} from '../../auth/types/authTypes';

export type DrumPosition = 'left' | 'right';
export type TabView = 'loading' | 'select_winch' | 'inspection' | 'sign_on' | 'launch' | 'skylog';

export interface WinchRead {
    id: number;
    registration: string;
    squadron_id: string;
}

export interface WinchHoursResponse {
    hours: number;
}

export interface LaunchRecord {
    id: number;
    launch_number: number | null;
    timestamp: string | null;
    remark: string | null;
    burn: boolean;
    operator_sn: string;
}

export interface WinchLogState {
    squadron: string;
    winchId: number | null;
    operatorSn: string;
    traineeSn: string | null;
    leftHistory: LaunchRecord[];
    rightHistory: LaunchRecord[];
    dayFinished: boolean;
    activeLauncherSn: string;
}

export type WinchAction =
    | { type: 'RECORD_LAUNCH'; payload: LaunchResponse }
    | { type: 'UNDO_LAUNCH'; payload: { drum: DrumPosition } }
    | { type: 'CHANGE_TRAINEE'; payload: DayLogResponse }
    | { type: 'ADD_REMARK'; payload: { drum: DrumPosition; id: number; remark: string | null } }
    | { type: 'FINISH_DAY'; payload: DayLogResponse }
    | { type: 'SET_WINCH_ID'; payload: number }
    | { type: 'SET_SQUADRON'; payload: string }
    | { type: 'SET_OPERATOR'; payload: string }
    | { type: 'SET_ACTIVE_LAUNCHER'; payload: string }
    | {
    type: 'HYDRATE_HISTORY'; payload: { sorted: LaunchResponse[]; traineeSn: string | null; }
};

export interface DerivedWinchState {
    leftTotal: number;
    rightTotal: number;
    leftLaunches: number;
    rightLaunches: number;
    leftLast: string | null;
    rightLast: string | null;
    lastDrum: DrumPosition | null;
    leftLastRecord: LaunchRecord | undefined;
    rightLastRecord: LaunchRecord | undefined;
}

// Responses for the new unified API endpoints
export interface WinchDayDataResponse {
    logs: DayLogResponse[];
    launches: LaunchResponse[];
}

export interface ExportDataResponse {
    winch: WinchRead;
    logs: DayLogResponse[];
    operators: OperatorRead[];
    brought_forward: {
        left: number;
        right: number;
    };
}
