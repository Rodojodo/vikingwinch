export type DrumPosition = 'left' | 'right';

export interface LaunchPayload {
  squadron_id: string;
  winch_id: number;
  operator_id: string;
  drum: DrumPosition;
  burn: boolean;
}

export interface LaunchResponse extends LaunchPayload {
  id: number;
  launch_number: 42,
  timestamp: string;
}