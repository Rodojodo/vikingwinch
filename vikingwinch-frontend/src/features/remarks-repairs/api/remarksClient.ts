// eslint-disable-next-line no-restricted-imports
import type { RemarkPayload, LaunchResponse } from '../../launch-ops/types';
import { apiFetch } from '../../../core/http/fetchClient';

export const postRemarkToDb = async (payload: RemarkPayload): Promise<LaunchResponse> => {
    return apiFetch<LaunchResponse>('/launches/remarks', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};
