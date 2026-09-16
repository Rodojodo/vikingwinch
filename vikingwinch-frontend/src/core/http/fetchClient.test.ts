import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, handleApiError, API_BASE_URL } from './fetchClient';

describe('fetchClient', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe('handleApiError', () => {
        it('does nothing when response is ok', async () => {
            const response = new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });

            await expect(handleApiError(response)).resolves.toBeUndefined();
        });

        it('extracts detail from json error response', async () => {
            const response = new Response(JSON.stringify({ detail: 'Custom error detail' }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });

            await expect(handleApiError(response)).rejects.toThrow('Custom error detail');
        });

        it('falls back to default HTTP error when json does not have detail', async () => {
            const response = new Response(JSON.stringify({ error: 'other_error' }), {
                status: 404,
                headers: { 'content-type': 'application/json' },
            });

            await expect(handleApiError(response)).rejects.toThrow('HTTP error: 404');
        });

        it('falls back to default HTTP error when json parsing throws', async () => {
            const response = new Response('Invalid json{', {
                status: 500,
                headers: { 'content-type': 'application/json' },
            });

            await expect(handleApiError(response)).rejects.toThrow('HTTP error: 500');
        });

        it('appends truncated text when content-type is not json', async () => {
            const longText = 'a'.repeat(200);
            const response = new Response(longText, {
                status: 502,
                headers: { 'content-type': 'text/plain' },
            });

            await expect(handleApiError(response)).rejects.toThrow(`HTTP error: 502 - ${'a'.repeat(150)}`);
        });

        it('falls back to status when non-json response text is empty', async () => {
            const response = new Response('', {
                status: 503,
                headers: { 'content-type': 'text/plain' },
            });

            await expect(handleApiError(response)).rejects.toThrow('HTTP error: 503');
        });

        it('falls back to status when text parsing throws for non-json', async () => {
            const response = {
                ok: false,
                status: 504,
                headers: new Headers({ 'content-type': 'text/html' }),
                json: vi.fn(),
                text: vi.fn().mockRejectedValue(new Error('Read failed')),
            } as unknown as Response;

            await expect(handleApiError(response)).rejects.toThrow('HTTP error: 504');
        });
    });

    describe('apiFetch', () => {
        it('fetches from API_BASE_URL and parses JSON response', async () => {
            const mockData = { id: 123, status: 'success' };
            globalThis.fetch = vi.fn().mockResolvedValue(
                new Response(JSON.stringify(mockData), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                })
            );

            const result = await apiFetch<typeof mockData>('/test-endpoint');

            expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/test-endpoint`, {
                headers: {
                    Accept: 'application/json',
                },
            });
            expect(result).toEqual(mockData);
        });

        it('merges custom options and headers', async () => {
            const mockData = { saved: true };
            globalThis.fetch = vi.fn().mockResolvedValue(
                new Response(JSON.stringify(mockData), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                })
            );

            const result = await apiFetch<typeof mockData>('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'test' }),
            });

            expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/save`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: 'test' }),
            });
            expect(result).toEqual(mockData);
        });

        it('returns null when response text is empty', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue(
                new Response(null, {
                    status: 204,
                })
            );

            const result = await apiFetch<void>('/empty');
            expect(result).toBeNull();
        });

        it('throws when handleApiError detects error status', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ detail: 'Unauthorized access' }), {
                    status: 401,
                    headers: { 'content-type': 'application/json' },
                })
            );

            await expect(apiFetch('/protected')).rejects.toThrow('Unauthorized access');
        });
    });
});
