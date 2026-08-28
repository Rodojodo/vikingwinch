import type {LaunchPayload} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';



export const postLaunchToDb = async (payload: LaunchPayload): Promise<any> =>{
    const response = await fetch(`${API_BASE_URL}/launches`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
}