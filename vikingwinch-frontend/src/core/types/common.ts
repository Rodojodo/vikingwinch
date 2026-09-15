export type DrumPosition = 'left' | 'right';
export interface SessionIdentity {
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
}
