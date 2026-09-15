import type { DrumPosition } from '../../../core/types';
import type { LaunchRecord } from './domain';

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
