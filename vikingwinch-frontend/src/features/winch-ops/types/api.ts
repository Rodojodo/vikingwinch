import type {OperatorRead} from '../../../core/types';

export interface OperatorResponse {
    operators: OperatorRead[];
}

export interface WinchRead {
    id: number;
    registration?: string;
    squadron_id: string;
    name?: string;
    status?: string;
}

export interface BroughtForwardResponse {
    brought_forward?: number;
    left?: number | null;
    right?: number | null;
}

export interface WinchHoursResponse {
    hours: number;
}

export interface DayLogResponse {
    id: number;
    squadron_id: string;
    winch_id: number;
    type: 'finish_day' | 'di' | 'sign_on';
    timestamp: string | null;
    operator_sn: string;
    trainee?: string | null;
    cable_check?: string | null;
    hours?: number | null;
}

export interface LaunchItemResponse {
    launch_id: number;
    launch_number: number | null;
    squadron_id: string;
    winch_id: number;
    drum: 'left' | 'right';
    timestamp: string | null;
    operator_sn: string;
    remarks?: string | null;
}

export interface WinchDayDataResponse {
    logs: DayLogResponse[];
    launches: LaunchItemResponse[];
}

export interface ExportDataResponse {
    winch: WinchRead;
    logs: DayLogResponse[];
    launches: LaunchItemResponse[];
    operators: OperatorRead[];
    brought_forward: {
        left: number | null;
        right: number | null;
    };
}
