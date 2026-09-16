import type {OperatorRead} from '../../../core/types';

export interface OperatorResponse {
    operators: OperatorRead[];
}

export interface WinchRead {
  id: number;
    registration?: string;
  squadron_id: string;
    name?: string;
    status?: string;
}

export interface BroughtForwardResponse {
    brought_forward?: number;
    left?: number | null;
    right?: number | null;
}

export interface WinchHoursResponse {
    hours: number;
}
