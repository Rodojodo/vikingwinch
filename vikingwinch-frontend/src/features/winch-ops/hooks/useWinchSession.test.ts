import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWinchSession } from './useWinchSession.ts';
import { postLaunchToDb, removeLaunchFromDb, postDayLogToDb } from '../api/dataClient';
import { initialState } from '../state/winchReducer';
import type { LaunchResponse, DayLogResponse } from '../types';

vi.mock('../api/dataClient', () => ({
  postLaunchToDb: vi.fn(),
  removeLaunchFromDb: vi.fn(),
  postDayLogToDb: vi.fn(),
  postRemarkToDb: vi.fn(),
}));

describe('useWinchSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockLaunchResponse = (drum: 'left' | 'right', id: number, timestamp: string, burn: boolean = false): LaunchResponse => ({
    id,
    launch_number: id,
    squadron_id: initialState.squadron,
    winch_id: 1,
    operator_id: initialState.operatorSn,
    drum,
    burn,
    timestamp,
    remark: null,
  });

  const createMockDayLogResponse = (trainee: string, id: number, timestamp: string): DayLogResponse => ({
    id,
    squadron_id: initialState.squadron,
    winch_id: 1,
    operator_id: initialState.operatorSn,
    trainee,
    type: 'sign_on',
    cable_check: null,
    hours: null,
    timestamp,
  });

  it('initializes with default state, empty derived properties, and no error', () => {
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));

    expect(result.current.state).toEqual(initialState);
    expect(result.current.derived).toEqual({
      leftTotal: 0, leftLaunches: 0,
      rightTotal: 0, rightLaunches: 0,
      leftLast: null,
      rightLast: null,
      lastDrum: null,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('executes a successful left launch, updating normalized and derived state', async () => {
    const mockResponse = createMockLaunchResponse('left', 101, '2026-08-30T09:15:00Z');
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await result.current.executeLaunch('left', false);
    });

    expect(postLaunchToDb).toHaveBeenCalledTimes(1);
    expect(postLaunchToDb).toHaveBeenCalledWith({
      squadron_id: initialState.squadron,
      winch_id: 1,
      operator_id: initialState.operatorSn,
      drum: 'left',
      burn: false,
    });

    expect(result.current.state.leftHistory).toEqual([{ id: 101, timestamp: '2026-08-30T09:15:00Z', remark: null, burn: false, launch_number: 101 }]);
    expect(result.current.derived.leftLaunches).toBe(1);
    expect(result.current.derived.leftLast).toBe('2026-08-30T09:15:00Z');
    expect(result.current.derived.lastDrum).toBe('left');
    expect(result.current.isLoading).toBe(false);
  });

  it('executes a successful right launch, updating normalized and derived state', async () => {
    const mockResponse = createMockLaunchResponse('right', 102, '2026-08-30T10:15:00Z');
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await result.current.executeLaunch('right', false);
    });

    expect(result.current.state.rightHistory).toEqual([{ id: 102, timestamp: '2026-08-30T10:15:00Z', remark: null, burn: false, launch_number: 102 }]);
    expect(result.current.derived.rightLaunches).toBe(1);
    expect(result.current.derived.rightLast).toBe('2026-08-30T10:15:00Z');
    expect(result.current.derived.lastDrum).toBe('right');
  });

  it('executes a burn launch and updates local state correctly', async () => {
    const mockResponse = createMockLaunchResponse('left', 103, '2026-08-30T11:00:00Z', true);
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });
    
    await act(async () => {
      await result.current.executeLaunch('left', true);
    });

    expect(postLaunchToDb).toHaveBeenCalledWith(expect.objectContaining({ burn: true }));
    expect(result.current.state.leftHistory).toHaveLength(1);
    expect(result.current.state.leftHistory[0].burn).toBe(true);
    expect(result.current.derived.leftTotal).toBe(1);
    expect(result.current.derived.leftLaunches).toBe(0);
  });

  it('successfully undoes the last launch and recalculates derived properties', async () => {
    const mockResponse1 = createMockLaunchResponse('left', 101, '2026-08-30T09:00:00Z');
    const mockResponse2 = createMockLaunchResponse('left', 102, '2026-08-30T09:10:00Z');

    vi.mocked(postLaunchToDb)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);
    vi.mocked(removeLaunchFromDb).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await result.current.executeLaunch('left', false);
      await result.current.executeLaunch('left', false);
    });

    expect(result.current.derived.leftLaunches).toBe(2);

    await act(async () => {
      await result.current.undoLaunch('left');
    });

    expect(removeLaunchFromDb).toHaveBeenCalledWith(102);
    expect(result.current.state.leftHistory).toEqual([{ id: 101, timestamp: '2026-08-30T09:00:00Z', remark: null, burn: false, launch_number: 101 }]);
    expect(result.current.derived.leftLaunches).toBe(1);
    expect(result.current.derived.leftLast).toBe('2026-08-30T09:00:00Z');
  });

  it('handles API rejection gracefully, sets error state, and throws', async () => {
    const errorMessage = 'Network timeout';
    vi.mocked(postLaunchToDb).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await expect(result.current.executeLaunch('left', false)).rejects.toThrow(errorMessage);
    });

    expect(result.current.state.leftHistory).toHaveLength(0);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it('computes lastDrum correctly by comparing timestamps when both drums have history', async () => {
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('left', 101, '2026-08-30T09:00:00Z'));
    await act(async () => {
      await result.current.executeLaunch('left', false);
    });
    expect(result.current.derived.lastDrum).toBe('left');

    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('right', 102, '2026-08-30T10:00:00Z'));
    await act(async () => {
      await result.current.executeLaunch('right', false);
    });
    expect(result.current.derived.lastDrum).toBe('right');

    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('left', 103, '2026-08-30T11:00:00Z'));
    await act(async () => {
      await result.current.executeLaunch('left', false);
    });
    expect(result.current.derived.lastDrum).toBe('left');
  });

  it('sets an error and aborts undoLaunch if the target drum history is empty', async () => {
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await result.current.undoLaunch('left');
    });

    expect(removeLaunchFromDb).not.toHaveBeenCalled();
    expect(result.current.error).toBe('No recorded launches to undo on left drum.');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles API rejection during undoLaunch, sets error state, and throws', async () => {
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('right', 101, '2026-08-30T09:00:00Z'));
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });
    await act(async () => {
      await result.current.executeLaunch('right', false);
    });

    const errorMessage = 'Database locked';
    vi.mocked(removeLaunchFromDb).mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      await expect(result.current.undoLaunch('right')).rejects.toThrow(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.state.rightHistory).toHaveLength(1);
  });

  it('executes a successful trainee change, dispatching the update and returning the response', async () => {
    const traineeSn = 'TRN-5050';
    const mockResponse = createMockDayLogResponse(traineeSn, 501, '2026-08-30T12:00:00Z');
    vi.mocked(postDayLogToDb).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    let responseData;
    await act(async () => {
      responseData = await result.current.changeTrainee(traineeSn);
    });

    expect(postDayLogToDb).toHaveBeenCalledTimes(1);
    expect(postDayLogToDb).toHaveBeenCalledWith({
      squadron_id: initialState.squadron,
      winch_id: 1,
      operator_id: initialState.operatorSn,
      trainee: traineeSn,
      type: 'sign_on',
      cable_check: null,
      hours: null,
    }, 1);

    expect(responseData).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles API rejection during changeTrainee, sets error state, and throws', async () => {
    const errorMessage = 'Trainee profile not found';
    vi.mocked(postDayLogToDb).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await expect(result.current.changeTrainee('TRN-9999')).rejects.toThrow(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it('falls back to default error messages if executeLaunch throws a non-Error exception', async () => {
    vi.mocked(postLaunchToDb).mockRejectedValueOnce('Unexpected string exception');
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await expect(result.current.executeLaunch('left', false)).rejects.toEqual('Unexpected string exception');
    });

    expect(result.current.error).toBe('Launch execution failed');
  });

  it('falls back to default error messages if undoLaunch throws a non-Error exception', async () => {
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('left', 101, '2026-08-30T09:00:00Z'));
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });
    await act(async () => {
      await result.current.executeLaunch('left', false);
    });

    vi.mocked(removeLaunchFromDb).mockRejectedValueOnce({ code: 500, status: 'FATAL' });

    await act(async () => {
      await expect(result.current.undoLaunch('left')).rejects.toEqual({ code: 500, status: 'FATAL' });
    });

    expect(result.current.error).toBe('Undo execution failed');
  });

  it('falls back to default error messages if changeTrainee throws a non-Error exception', async () => {
    vi.mocked(postDayLogToDb).mockRejectedValueOnce('Unexpected string exception');
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await expect(result.current.changeTrainee('TRN-1111')).rejects.toEqual('Unexpected string exception');
    });

    expect(result.current.error).toBe('Trainee change failed');
  });

  it('adds a remark successfully to the last launch on the specified drum', async () => {
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('left', 101, '2026-08-30T09:00:00Z'));
    const { postRemarkToDb } = await import('../api/dataClient');
    
    vi.mocked(postRemarkToDb).mockResolvedValueOnce({} as any);
    
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });
    
    await act(async () => {
      await result.current.executeLaunch('left', false);
    });

    await act(async () => {
      await result.current.addRemark('Cable dropped', 'left');
    });

    expect(postRemarkToDb).toHaveBeenCalledTimes(1);
    expect(postRemarkToDb).toHaveBeenCalledWith({
      launch_id: 101,
      winch_id: 1,
      remark: 'Cable dropped',
    });

    expect(result.current.state.leftHistory[0].remark).toBe('Cable dropped');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fails to add remark if there are no launches on that drum', async () => {
    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await expect(result.current.addRemark('Cable dropped', 'right')).rejects.toThrow('No launch recorded on right drum.');
    });

    expect(result.current.error).toBe('No launch recorded on right drum.');
  });

  it('handles API rejection during addRemark and throws standard Error', async () => {
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('left', 101, '2026-08-30T09:00:00Z'));
    const { postRemarkToDb } = await import('../api/dataClient');
    vi.mocked(postRemarkToDb).mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await result.current.executeLaunch('left', false);
    });

    await act(async () => {
      await expect(result.current.addRemark('Cable dropped', 'left')).rejects.toThrow('Network Error');
    });

    expect(result.current.error).toBe('Network Error');
  });

  it('falls back to default error message if addRemark throws non-Error', async () => {
    vi.mocked(postLaunchToDb).mockResolvedValueOnce(createMockLaunchResponse('left', 101, '2026-08-30T09:00:00Z'));
    const { postRemarkToDb } = await import('../api/dataClient');
    vi.mocked(postRemarkToDb).mockRejectedValueOnce('Some string error');

    const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });

    await act(async () => {
      await result.current.executeLaunch('left', false);
    });

    await act(async () => {
      await expect(result.current.addRemark('Cable dropped', 'left')).rejects.toEqual('Some string error');
    });

    expect(result.current.error).toBe('Add remark failed');
  });
});
  describe('finishDay', () => {
    it('calls API and dispatches FINISH_DAY on success', async () => {
      const mockResponse = { id: 3 };
      vi.mocked(postDayLogToDb).mockResolvedValue(mockResponse as any);
      
      const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });
      
      let response;
      await act(async () => {
        response = await result.current.finishDay('OP1', 12.5);
      });
      
      expect(postDayLogToDb).toHaveBeenCalled();
      expect(response).toEqual(mockResponse);
    });

    it('handles finishDay error', async () => {
      vi.mocked(postDayLogToDb).mockRejectedValue(new Error('API error'));
      
      const { result } = renderHook(() => useWinchSession("123 VGS", "OFF-1001"));
    act(() => { result.current.setWinchId(1); });
      
      await act(async () => {
        await expect(result.current.finishDay('OP1', 12.5)).rejects.toThrow('API error');
      });
      
      expect(result.current.error).toBe('API error');
    });
  });
