import {apiFetch} from '../../../core/http/fetchClient';

export interface ResetTestvgsResponse {
    squadron_id: string;
    winches_reset: number;
    finish_day: string;
    launches_created: number;
}

export function resetTestvgs(): Promise<ResetTestvgsResponse> {
    return apiFetch<ResetTestvgsResponse>('/dev/reset-testvgs', {
        method: 'POST',
    });
}
