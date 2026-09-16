export interface RemarkPayload {
    launch_id: number;
    winch_id: number;
    remark: string | null;
}

export interface RemarkResponse {
    id: number;
    winch_id: number;
    drum?: 'left' | 'right';
    burn?: boolean;
    operator_sn?: string;
    trainee?: string | null;
    launch_number?: number | null;
    timestamp?: string;
    remark: string | null;
}
