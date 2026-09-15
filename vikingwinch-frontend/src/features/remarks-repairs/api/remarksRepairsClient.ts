import type {RemarkPayload} from '../types';
import type {LaunchResponse} from '../../launch-ops/types';
import {request} from '../../../core/http/request';

export const postRemarkToDb = async (payload: RemarkPayload): Promise<LaunchResponse> => {
    return request<LaunchResponse>(`/launches/remarks`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
