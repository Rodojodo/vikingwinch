import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postLaunchToDb, removeLaunchFromDb, postDayLogToDb, postRemarkToDb, getOperatorsForSquadron, getWinch, getDayLog, getWinchesForSquadron } from './dataClient.ts';
import type { LaunchPayload, LaunchResponse, DayLogPayload, DayLogResponse, RemarkPayload } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

const createMockHeaders = (contentType: string | null = 'application/json') => ({
  get: vi.fn().mockImplementation((key: string) =>
    key.toLowerCase() === 'content-type' ? contentType : null
  )
});

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
    remark: null,
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
      headers: createMockHeaders(),
      json: async () => ({ detail: 'Invalid winch configuration' }),
    } as unknown as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('Invalid winch configuration');
  });

  it('falls back to HTTP status when backend returns unparseable error response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      headers: createMockHeaders('text/plain'),
      json: async () => {
        throw new Error('Unexpected token');
      },
      text: async () => 'Raw internal server error trace',
    } as unknown as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('HTTP error: 500 - Raw internal server error trace');
  });

  it('falls back to HTTP status when backend returns JSON without detail', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      headers: createMockHeaders('application/json'),
      json: async () => ({ otherField: 'something' }),
    } as unknown as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('HTTP error: 400');
  });

  it('falls back to HTTP status when json parsing throws', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      headers: createMockHeaders('application/json'),
      json: async () => {
        throw new Error('Unexpected end of JSON input');
      },
    } as unknown as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('HTTP error: 500');
  });

  it('falls back to HTTP status when text parsing throws', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      headers: createMockHeaders('text/plain'),
      text: async () => {
        throw new Error('Cannot read text');
      },
    } as unknown as Response);

    await expect(postLaunchToDb(mockPayload)).rejects.toThrow('HTTP error: 503');
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
      headers: createMockHeaders(),
      json: async () => ({ detail: `Launch with id ${targetLaunchId} not found` }),
    } as unknown as Response);

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

    const result = await postDayLogToDb(mockDayLogPayload, targetWinchId);

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
      headers: createMockHeaders(),
      json: async () => ({ detail: 'Invalid log sequence' }),
    } as unknown as Response);

    await expect(postDayLogToDb(mockDayLogPayload, targetWinchId)).rejects.toThrow(
      'Invalid log sequence'
    );
  });
});

describe('postRemarkToDb', () => {
  const mockPayload: RemarkPayload = {
    launch_id: 101,
    winch_id: 1,
    remark: 'Cable drop early',
  };

  const mockResponse: LaunchResponse = {
    id: 101,
    launch_number: 42,
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    drum: 'left',
    burn: false,
    remark: 'Cable drop early',
    timestamp: '2026-08-30T10:00:00Z',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes a POST request to add a remark and resolves the updated launch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await postRemarkToDb(mockPayload);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/remarks`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload),
    });
    expect(result).toStrictEqual(mockResponse);
  });

  it('throws backend detail message when remark fails validation', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 422,
      headers: createMockHeaders(),
      json: async () => ({ detail: 'Launch ID not found for remark' }),
    } as unknown as Response);

    await expect(postRemarkToDb(mockPayload)).rejects.toThrow('Launch ID not found for remark');
  });
});
describe('getOperatorsForSquadron', () => {
  const squadronId = '123 VGS';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('executes GET request and returns operators array', async () => {
    const mockOperators = [{ id: 1, name: 'Op 1' }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockOperators),
    } as Response);

    const result = await getOperatorsForSquadron(squadronId);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/squadrons/${squadronId}/operators`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    expect(result).toStrictEqual(mockOperators);
  });

  it('returns empty array if text is empty', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '',
    } as Response);

    const result = await getOperatorsForSquadron(squadronId);
    expect(result).toStrictEqual([]);
  });

  it('throws error on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network fail'));

    await expect(getOperatorsForSquadron(squadronId)).rejects.toThrow('Network fail');
  });
});

describe('getWinch', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('executes GET request and returns winch object', async () => {
    const mockWinch = { id: 1, registration: 'W1' };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockWinch,
    } as Response);

    const result = await getWinch(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockWinch);
  });
});

describe('getDayLog', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('executes GET request and returns day logs array', async () => {
    const mockLogs = [{ id: 1, type: 'sign_on' }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockLogs,
    } as Response);

    const result = await getDayLog(1, '2026-09-01');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockLogs);
  });
});

describe('getWinchesForSquadron', () => {
  const squadronId = '123 VGS';
  
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('executes GET request and returns winches array', async () => {
    const mockWinches = [{ id: 1, name: 'Winch 1' }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockWinches),
    } as Response);

    const result = await getWinchesForSquadron(squadronId);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockWinches);
  });

  it('returns empty array if text is empty', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '',
    } as Response);

    const result = await getWinchesForSquadron(squadronId);
    expect(result).toStrictEqual([]);
  });
});
