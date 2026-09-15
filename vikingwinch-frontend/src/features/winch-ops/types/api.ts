




export type DayLogType = 'finish_day' | 'di' | 'sign_on';








export interface OperatorResponse {
  operators: import('../../../core/types').OperatorRead[]
}

export interface WinchRead {
  id: number;
  registration: string;
  squadron_id: string;
}
