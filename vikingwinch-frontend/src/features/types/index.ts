export interface WinchLogState {
    leftLaunches: number;
    rightLaunches: number;
    leftLast: string | null;
    rightLast: string | null;
    operatorSn: string;
    lastDrum: 'left' | 'right' | null;
    squadron: string;
    winchId: number;
}

export type WinchAction =
  | { type: 'RECORD_LEFT_LAUNCH'; payload: { timestamp: string } }
  | { type: 'RECORD_RIGHT_LAUNCH'; payload: { timestamp: string } };

export * from './launches'