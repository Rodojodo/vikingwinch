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

export type DayLogType = 'finish_day' | 'di' | 'sign_on';

export interface DayLogPayload {
  squadron_id: string;
  winch_id: number;
  operator_id: string;
  trainee: string| null;
  'type': DayLogType;
  cable_check: string | null;
  hours: number| null;
}