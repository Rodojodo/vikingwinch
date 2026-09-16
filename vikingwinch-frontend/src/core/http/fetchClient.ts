export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export async function handleApiError(response: Response): Promise<void> {
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

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }
    if (options?.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    await handleApiError(response);

    const text = await response.text();
    return JSON.parse(text || 'null') as T;
}
