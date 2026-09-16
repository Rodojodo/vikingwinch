import type {RemarkPayload, RemarkResponse} from '../types';
import {apiFetch} from '../../../core/http/fetchClient';

export const postRemarkToDb = async (payload: RemarkPayload): Promise<RemarkResponse> => {
    return apiFetch<RemarkResponse>('/launches/remarks', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};
