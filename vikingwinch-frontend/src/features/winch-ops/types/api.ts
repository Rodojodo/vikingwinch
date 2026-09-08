import type { DrumPosition } from './domain.ts'

export interface LaunchPayload {
  squadron_id: string;
  winch_id: number;
  operator_sn: string;
  drum: DrumPosition;
  is_burn: boolean;
}

export interface LaunchResponse extends LaunchPayload {
  launch_id: number;
  launch_number: number | null;
  timestamp: string | null;
  remarks: string | null;
}

export type DayLogType = 'finish_day' | 'di' | 'sign_on';

export interface DayLogPayload {
  squadron_id: string;
  winch_id: number;
  operator_sn: string;
  trainee: string | null;
  'type': DayLogType;
  cable_check: string | null;
  hours: number| null;
}

export interface DayLogResponse {
  id: number;
  squadron_id: string;
  winch_id: number;
  operator_sn: string;
  trainee: string | null;
  'type': DayLogType;
  cable_check: string | null;
  hours: number| null;
  timestamp: string | null;
}

export interface RemarkPayload {
  launch_id: number;
  winch_id: number;
  remark: string | null;
}

export interface OperatorRead {
  service_no: string;
  name: string;
  squadron_id: string;
}

export interface OperatorResponse {
  operators: OperatorRead[]
}

export interface WinchRead {
  id: number;
  registration: string;
  squadron_id: string;
}
