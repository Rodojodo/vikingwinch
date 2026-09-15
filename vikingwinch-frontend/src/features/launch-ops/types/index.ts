export type { LaunchRecord } from './domain';
export type { DerivedWinchState } from './state';

export interface LaunchPayload {
  winch_id: number;
  drum: 'left' | 'right';
  burn: boolean;
  operator_sn: string;
  trainee: string | null;
}

export interface LaunchResponse extends LaunchPayload {
  id: number;
  launch_number: number | null;
  timestamp: string;
  remark: string | null;
}

export interface RemarkPayload {
  launch_id: number;
  winch_id: number;
  remark: string | null;
}
