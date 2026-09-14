import type {RemarkPayload} from '../types/remarksRepairsTypes';
import type {LaunchResponse} from '../../launch-ops/types/launchOpsTypes';
import {API_BASE_URL, handleApiError} from '../../winch-ops/api/utils';

export const postRemarkToDb = async (payload: RemarkPayload): Promise<LaunchResponse> => {
    const response = await fetch(`${API_BASE_URL}/launches/remarks`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    await handleApiError(response);

    return response.json();
}
