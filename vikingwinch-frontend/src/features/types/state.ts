import type {DrumPosition} from './domain';
import type {DayLogResponse, LaunchResponse} from './api';


export interface LaunchRecord {
  id: number;
  timestamp: string | null;
  remark: string | null;
  burn: boolean;
}


export interface WinchLogState {
  squadron: string;
  winchId: number;
  operatorSn: string;
  traineeSn: string | null;
  leftHistory: LaunchRecord[];
  rightHistory: LaunchRecord[];
}


export type WinchAction =
  | { type: 'RECORD_LAUNCH'; payload: LaunchResponse }
  | { type: 'UNDO_LAUNCH'; payload: { drum: DrumPosition } }
  | { type: 'CHANGE_TRAINEE'; payload: DayLogResponse }
  | { type: 'ADD_REMARK'; payload: { drum: DrumPosition; id: number; remark: string | null }
};


export interface Trainee {
    id: string;
    name: string;
}


export interface DerivedWinchState {
  leftTotal: number;
  rightTotal: number;
  leftLaunches: number;
  rightLaunches: number;
  leftLast: string | null;
  rightLast: string | null;
  lastDrum: DrumPosition | null;
  leftLastRecord: LaunchRecord | undefined;
  rightLastRecord: LaunchRecord | undefined;
}
