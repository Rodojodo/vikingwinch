import type {DrumPosition} from '../../../core/types';

export interface LaunchPayload {
    winch_id: number;
    drum: DrumPosition;
    burn: boolean;
    operator_sn: string;
    trainee: string | null;
}

export interface LaunchResponse {
    id: number;
    winch_id: number;
    drum: DrumPosition;
    burn: boolean;
    operator_sn: string;
    trainee: string | null;
    launch_number: number | null;
    timestamp: string;
    remark: string | null;
}
