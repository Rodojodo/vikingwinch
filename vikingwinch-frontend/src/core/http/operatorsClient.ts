import { apiFetch } from './fetchClient';
import type { OperatorRead } from '../types';

export const getOperatorsForSquadron = async (squadronId: string, signal?: AbortSignal): Promise<OperatorRead[]> => {
    return apiFetch<OperatorRead[]>(`/squadrons/${squadronId}/operators`, {
        method: 'GET',
        signal,
    });
};
