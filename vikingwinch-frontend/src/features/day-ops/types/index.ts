export interface DayLogPayload {
  squadron_id: string;
  winch_id: number;
  operator_sn: string;
  trainee: string | null;
  type: 'sign_on' | 'di' | 'finish_day' | 'change_trainee';
  cable_check: string | null;
  hours: number | null;
}

export interface DayLogResponse extends DayLogPayload {
  id: number;
  timestamp: string;
}
