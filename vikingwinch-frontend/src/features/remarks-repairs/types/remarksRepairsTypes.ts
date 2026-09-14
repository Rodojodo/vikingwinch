export type PanelType = 'remarks' | 'repairs' | null;

export interface RemarkPayload {
    launch_id: number;
    winch_id: number;
    remark: string | null;
}
