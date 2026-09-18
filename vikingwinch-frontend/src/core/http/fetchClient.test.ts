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
            const response = new Response('', {
                status: 504,
                headers: { 'content-type': 'text/html' },
            });
            vi.spyOn(response, 'text').mockRejectedValue(new Error('Read failed'));

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

            const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
            expect(url).toBe(`${API_BASE_URL}/test-endpoint`);
            const headers = new Headers(init?.headers);
            expect(headers.get('Accept')).toBe('application/json');
            expect(result).toEqual(mockData);
        });

        it('throws if response is 200 but content-type is not json', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue(
                new Response('<!doctype html><html></html>', {
                    status: 200,
                    headers: { 'content-type': 'text/html; charset=utf-8' },
                })
            );

            await expect(apiFetch('/test-endpoint')).rejects.toThrow('Expected JSON response but received text/html; charset=utf-8');
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

            const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
            expect(url).toBe(`${API_BASE_URL}/save`);
            expect(init?.method).toBe('POST');
            expect(init?.body).toBe(JSON.stringify({ name: 'test' }));
            const headers = new Headers(init?.headers);
            expect(headers.get('Accept')).toBe('application/json');
            expect(headers.get('Content-Type')).toBe('application/json');
            expect(result).toEqual(mockData);
        });

        it('preserves headers passed as Headers instance or array', async () => {
            const mockData = { ok: true };
            globalThis.fetch = vi.fn().mockResolvedValue(
                new Response(JSON.stringify(mockData), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                })
            );

            const customHeaders = new Headers({ 'X-Custom-Header': 'custom-value' });
            await apiFetch<typeof mockData>('/headers-instance', {
                headers: customHeaders,
            });

            const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
            const headers = new Headers(init?.headers);
            expect(headers.get('X-Custom-Header')).toBe('custom-value');
            expect(headers.get('Accept')).toBe('application/json');
        });

        it('sets Content-Type to application/json when body is provided without explicit content-type header', async () => {
            const mockData = { ok: true };
            globalThis.fetch = vi.fn().mockResolvedValue(
                new Response(JSON.stringify(mockData), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                })
            );

            const result = await apiFetch<typeof mockData>('/post-auto-header', {
                method: 'POST',
                body: JSON.stringify({ key: 'val' }),
            });

            const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
            expect(url).toBe(`${API_BASE_URL}/post-auto-header`);
            expect(init?.method).toBe('POST');
            expect(init?.body).toBe(JSON.stringify({ key: 'val' }));
            const headers = new Headers(init?.headers);
            expect(headers.get('Accept')).toBe('application/json');
            expect(headers.get('Content-Type')).toBe('application/json');
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
