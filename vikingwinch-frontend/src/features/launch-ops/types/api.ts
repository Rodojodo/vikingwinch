import type {DrumPosition} from '../../../core/types';

export interface LaunchPayload {
    squadron_id: string;
    winch_id: number;
    operator_sn: string;
    drum: DrumPosition;
    is_burn: boolean;
}

export interface LaunchResponse {
    launch_id: number;
    launch_number: number | null;
    squadron_id: string;
    winch_id: number;
    drum: DrumPosition;
    timestamp: string | null;
    operator_sn: string;
    remarks: string | null;
}

export interface LaunchCorrectionPayload {
    winch_id: number;
    squadron_id?: string | null;
    operator_sn?: string | null;
    left?: number | null;
    right?: number | null;
}
