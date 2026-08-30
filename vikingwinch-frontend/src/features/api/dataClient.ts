import type {LaunchPayload, LaunchResponse} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';


export const postLaunchToDb = async (payload: LaunchPayload): Promise<LaunchResponse> =>{
    const response = await fetch(`${API_BASE_URL}/launches`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || `HTTP error: ${response.status}`);
  }

    return response.json();
}


export const removeLaunchFromDb = async (launchId: number): Promise<void> =>{
    const response = await fetch(`${API_BASE_URL}/launches/${launchId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
    });

    if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || `HTTP error: ${response.status}`);
  }
}