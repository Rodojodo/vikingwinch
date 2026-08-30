import type { DrumPosition } from './domain'

export interface LaunchPayload {
  squadron_id: string;
  winch_id: number;
  operator_id: string;
  drum: DrumPosition;
  burn: boolean;
}

export interface LaunchResponse extends LaunchPayload {
  id: number;
  launch_number: number;
  timestamp: string | null;
}
