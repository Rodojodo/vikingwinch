import type {OperatorRead} from '../types';
import {request} from '../../../core/http/request';

export const getOperatorsForSquadron = async (squadronId: string, signal?: AbortSignal): Promise<OperatorRead[]> => {
    const res = await request<OperatorRead[]>(`/squadrons/${squadronId}/operators`, { signal });
    return res || [];
}
