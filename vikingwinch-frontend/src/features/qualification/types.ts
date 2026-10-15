export type QualificationState = 'green' | 'amber' | 'blue' | 'red' | 'nil';

export interface OperatorQualificationsRead {
    service_no: string;
    stars_resource_id: string | null;
    c005_operator: QualificationState;
    c005_expiry: string | null;
    e004_instructor: QualificationState;
    e004_expiry: string | null;
    c003_examiner: QualificationState;
    c003_expiry: string | null;
    rolling_currency: QualificationState;
    rolling_expiry: string | null;
    is_stale: boolean;
    last_checked_at: string;
}

export function isValidQualification(state?: QualificationState | string | null): boolean {
    if (!state) return false;
    return state === 'green' || state === 'amber';
}
