import type {DrumPosition} from './domain';
import type {LaunchResponse} from './api';

export interface LaunchRecord {
  id: number;
  timestamp: string | null;
}

export interface WinchLogState {
  squadron: string;
  winchId: number;
  operatorSn: string;
  leftHistory: LaunchRecord[];
  rightHistory: LaunchRecord[];
}


export type WinchAction =
  | { type: 'RECORD_LAUNCH'; payload: LaunchResponse }
  | { type: 'UNDO_LAUNCH'; payload: { drum: DrumPosition } };


export interface Trainee {
    id: string;
    name: string;
}