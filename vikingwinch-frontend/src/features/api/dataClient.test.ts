import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postLaunchToDb, removeLaunchFromDb, postTraineeChangeToDb } from '../api/dataClient';
import type { LaunchPayload, LaunchResponse, DayLogPayload, DayLogResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

describe('postLaunchToDb', () => {
  const mockPayload: LaunchPayload = {
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    drum: 'left',
    burn: false,
  };

  const mockResponse: LaunchResponse = {
    id: 101,
    launch_number: 42,
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    drum: 'left',
    burn: false,
    timestamp: '2026-08-30T10:00:00Z',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes a POST request with payload (including burn) and resolves parsed response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await postLaunchToDb(mockPayload);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/launches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload),
    });
    expect(result).toStrictEqual(mockResponse);
  });

  it('throws backend detail message when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Invalid winch configuration' }),
    } as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('Invalid winch configuration');
  });

  it('falls back to HTTP status when backend returns unparseable error response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Unexpected token');
      },
    } as unknown as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('HTTP error: 500');
  });
});

describe('removeLaunchFromDb', () => {
  const targetLaunchId = 101;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes a DELETE request targeting launch ID and resolves cleanly on 204', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    await expect(removeLaunchFromDb(targetLaunchId)).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/launches/${targetLaunchId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
  });

  it('throws backend detail message when delete fails with 404', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: `Launch with id ${targetLaunchId} not found` }),
    } as Response);

    await expect(removeLaunchFromDb(targetLaunchId)).rejects.toThrow(
      `Launch with id ${targetLaunchId} not found`
    );
  });
});

describe('postTraineeChangeToDb', () => {
  const targetWinchId = 1;
  const mockDayLogPayload: DayLogPayload = {
    squadron_id: '123 VGS',
    winch_id: targetWinchId,
    operator_id: 'OFF-1001',
    trainee: 'TRN-5501',
    type: 'sign_on',
    cable_check: 'OK',
    hours: null,
  };

  const mockDayLogResponse: DayLogResponse = {
    id: 505,
    squadron_id: '123 VGS',
    winch_id: targetWinchId,
    operator_id: 'OFF-1001',
    trainee: 'TRN-5501',
    type: 'sign_on',
    cable_check: 'OK',
    hours: null,
    timestamp: '2026-08-30T10:15:00Z',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes a POST request with payload and correct URI structure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDayLogResponse,
    } as Response);

    const result = await postTraineeChangeToDb(mockDayLogPayload, targetWinchId);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/winch/${targetWinchId}/day_log`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockDayLogPayload),
    });
    expect(result).toStrictEqual(mockDayLogResponse);
  });

  it('throws backend detail message when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Invalid log sequence' }),
    } as Response);

    await expect(postTraineeChangeToDb(mockDayLogPayload, targetWinchId)).rejects.toThrow(
      'Invalid log sequence'
    );
  });
});