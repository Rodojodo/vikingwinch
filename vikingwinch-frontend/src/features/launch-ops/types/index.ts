import type {DrumPosition} from '../../winch-ops/types';

export interface LaunchPayload {
    squadron_id: string;
    winch_id: number;
    operator_sn: string;
    drum: DrumPosition;
    is_burn: boolean;
}

export interface LaunchResponse extends LaunchPayload {
    launch_id: number;
    launch_number: number | null;
    timestamp: string | null;
    remarks: string | null;
}

export interface LaunchRecord {
    id: number;
    launch_number: number | null;
    timestamp: string | null;
    remark: string | null;
    burn: boolean;
    operator_sn: string;
}
