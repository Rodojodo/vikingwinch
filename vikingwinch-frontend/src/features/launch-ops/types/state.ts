import type {DrumPosition} from '../../../core/types';
import type {LaunchRecord} from './domain';

export interface LaunchState {
    leftHistory: LaunchRecord[];
    rightHistory: LaunchRecord[];
}

export type LaunchAction =
    | { type: 'RECORD_LAUNCH'; payload: { drum: DrumPosition; record: LaunchRecord } }
    | { type: 'UNDO_LAUNCH'; payload: { drum: DrumPosition } }
    | { type: 'HYDRATE_HISTORY'; payload: { left: LaunchRecord[]; right: LaunchRecord[] } }
    | { type: 'ADD_REMARK'; payload: { drum: DrumPosition; id: number; remark: string | null } };

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
