export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function handleApiError(response: Response): Promise<void> {
    if (!response.ok) {
        let errorMsg = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorMsg;
        } catch {
            // Ignore JSON parse error if response has no valid JSON
        }
        throw new Error(errorMsg);
    }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    await handleApiError(response);
    
    // For 204 No Content, we might not have JSON to parse
    if (response.status === 204) return null as unknown as T;
    
    const text = await response.text();
    return text ? JSON.parse(text) : (null as unknown as T);
}
