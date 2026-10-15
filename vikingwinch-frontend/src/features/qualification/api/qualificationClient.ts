import { apiFetch } from '../../../core/http/fetchClient';
import type { OperatorQualificationsRead } from '../types';

export async function getQualifications(): Promise<OperatorQualificationsRead> {
    return apiFetch<OperatorQualificationsRead>('/operators/me/qualifications');
}

export async function refreshQualifications(): Promise<OperatorQualificationsRead> {
    return apiFetch<OperatorQualificationsRead>('/operators/me/qualifications/refresh', {
        method: 'POST',
    });
}
