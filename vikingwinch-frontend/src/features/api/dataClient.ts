import type {DayLogPayload, DayLogResponse, LaunchPayload, LaunchResponse, RemarkPayload} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

async function handleApiError(response: Response): Promise<void> {
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP error: ${response.status}`;

        if (contentType && contentType.includes("application/json")) {
            const errorBody = await response.json().catch(() => null);
            if (errorBody?.detail) {
                errorMessage = errorBody.detail;
            }
        } else {
            const textResponse = await response.text().catch(() => null);
            if (textResponse) {
                errorMessage += ` - ${textResponse.substring(0, 150)}`;
            }
        }

        throw new Error(errorMessage);
    }
}

export const postLaunchToDb = async (payload: LaunchPayload): Promise<LaunchResponse> =>{
    const response = await fetch(`${API_BASE_URL}/launches`, {
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


export const removeLaunchFromDb = async (launchId: number): Promise<void> =>{
    const response = await fetch(`${API_BASE_URL}/launches/${launchId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
    });

    await handleApiError(response);
}


export const postDayLogToDb = async (payload: DayLogPayload, winchId: number): Promise<DayLogResponse> =>{
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/day_log`, {
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



export const postRemarkToDb = async (payload: RemarkPayload): Promise<LaunchResponse> => {
    const response = await fetch(`${API_BASE_URL}/remarks`, {
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

export const getOperatorsForSquadron = async (squadronId: string): Promise<any[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/squadrons/${squadronId}/operators`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        await handleApiError(response);
        
        const text = await response.text();
        if (!text) return [];
        return JSON.parse(text);
    } catch (error) {
        console.error("Failed to fetch operators:", error);
        return [];
    }
}

export const getWinch = async (winchId: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/winches/${winchId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}

export const getDayLog = async (winchId: number, day: string): Promise<DayLogResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/winch/${winchId}/day_log?day=${day}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });
    await handleApiError(response);
    return response.json();
}