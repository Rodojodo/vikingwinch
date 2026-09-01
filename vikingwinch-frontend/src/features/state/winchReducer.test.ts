import { describe, it, expect } from 'vitest';
import { winchReducer, initialState } from './winchReducer';
import type { WinchAction, LaunchResponse, DayLogResponse } from '../types';

describe('winchReducer', () => {
  const createLaunchPayload = (drum: 'left' | 'right', id: number, timestamp: string): LaunchResponse => ({
    id,
    launch_number: id,
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    drum,
    burn: false,
    timestamp,
    remark: null,
  });

  const createDayLogPayload = (trainee: string): DayLogResponse => ({
    id: 501,
    squadron_id: '123 VGS',
    winch_id: 1,
    operator_id: 'OFF-1001',
    trainee,
    type: 'sign_on',
    cable_check: null,
    hours: null,
    timestamp: '2026-08-30T12:00:00Z',
  });

  it('returns the initial state when an unknown action is dispatched', () => {
    const action = { type: 'UNKNOWN_ACTION' } as unknown as WinchAction;
    const result = winchReducer(initialState, action);

    expect(result).toEqual(initialState);
  });

  it('processes RECORD_LAUNCH for the left drum and appends to leftHistory', () => {
    const payload = createLaunchPayload('left', 101, '2026-08-30T09:15:00Z');
    const action: WinchAction = { type: 'RECORD_LAUNCH', payload };

    const result = winchReducer(initialState, action);

    expect(result.leftHistory).toEqual([{ id: 101, timestamp: '2026-08-30T09:15:00Z', remark: null, burn: false, launch_number: 101 }]);
    expect(result.rightHistory).toEqual([]);
  });

  it('processes RECORD_LAUNCH for the right drum and appends to rightHistory', () => {
    const payload = createLaunchPayload('right', 102, '2026-08-30T10:15:00Z');
    const action: WinchAction = { type: 'RECORD_LAUNCH', payload };

    const result = winchReducer(initialState, action);

    expect(result.rightHistory).toEqual([{ id: 102, timestamp: '2026-08-30T10:15:00Z', remark: null, burn: false, launch_number: 102 }]);
    expect(result.leftHistory).toEqual([]);
  });

  it('accumulates multiple launches accurately over successive dispatches', () => {
    let state = winchReducer(initialState, {
      type: 'RECORD_LAUNCH',
      payload: createLaunchPayload('left', 101, '2026-08-30T09:15:00Z')
    });

    state = winchReducer(state, {
      type: 'RECORD_LAUNCH',
      payload: createLaunchPayload('right', 102, '2026-08-30T09:20:00Z')
    });

    state = winchReducer(state, {
      type: 'RECORD_LAUNCH',
      payload: createLaunchPayload('left', 103, '2026-08-30T09:30:00Z')
    });

    expect(state.leftHistory).toHaveLength(2);
    expect(state.leftHistory[1].id).toBe(103);
    expect(state.rightHistory).toHaveLength(1);
    expect(state.rightHistory[0].id).toBe(102);
  });

  it('processes UNDO_LAUNCH for the left drum and removes the last record', () => {
    const state = {
      ...initialState,
      leftHistory: [
        { id: 101, timestamp: '2026-08-30T09:15:00Z', remark: null, burn: false, launch_number: 101 },
        { id: 102, timestamp: '2026-08-30T09:25:00Z', remark: null, burn: false, launch_number: 102 },
      ],
    };

    const action: WinchAction = { type: 'UNDO_LAUNCH', payload: { drum: 'left' } };
    const result = winchReducer(state, action);

    expect(result.leftHistory).toEqual([{ id: 101, timestamp: '2026-08-30T09:15:00Z', remark: null, burn: false, launch_number: 101 }]);
  });

  it('processes UNDO_LAUNCH for the right drum and removes the last record', () => {
    const state = {
      ...initialState,
      rightHistory: [
        { id: 201, timestamp: '2026-08-30T10:15:00Z', remark: null, burn: false, launch_number: 201 },
        { id: 202, timestamp: '2026-08-30T10:25:00Z', remark: null, burn: false, launch_number: 202 },
      ],
    };

    const action: WinchAction = { type: 'UNDO_LAUNCH', payload: { drum: 'right' } };
    const result = winchReducer(state, action);

    expect(result.rightHistory).toEqual([{ id: 201, timestamp: '2026-08-30T10:15:00Z', remark: null, burn: false, launch_number: 201 }]);
  });

  it('handles UNDO_LAUNCH gracefully when the target history stack is empty', () => {
    const action: WinchAction = { type: 'UNDO_LAUNCH', payload: { drum: 'right' } };
    const result = winchReducer(initialState, action);

    expect(result.rightHistory).toEqual([]);
  });

  it('processes CHANGE_TRAINEE and updates the traineeSn field', () => {
    const payload = createDayLogPayload('TRN-8080');
    const action: WinchAction = { type: 'CHANGE_TRAINEE', payload };

    const result = winchReducer(initialState, action);

    expect(result.traineeSn).toBe('TRN-8080');
    expect(result.squadron).toBe(initialState.squadron);
    expect(result.leftHistory).toEqual(initialState.leftHistory);
  });

  it('processes ADD_REMARK and updates the correct launch record', () => {
    const state = {
      ...initialState,
      leftHistory: [
        { id: 101, timestamp: '2026-08-30T09:15:00Z', remark: null, burn: false, launch_number: 101 },
        { id: 102, timestamp: '2026-08-30T09:25:00Z', remark: null, burn: false, launch_number: 102 },
      ],
    };

    const action: WinchAction = {
      type: 'ADD_REMARK',
      payload: { drum: 'left', id: 102, remark: 'Cable dropped' }
    };

    const result = winchReducer(state, action);

    expect(result.leftHistory).toHaveLength(2);
    expect(result.leftHistory[0].remark).toBeNull();
    expect(result.leftHistory[1].remark).toBe('Cable dropped');
    expect(result.rightHistory).toEqual(initialState.rightHistory);
  });

  it('processes ADD_REMARK for right drum and updates the correct launch record', () => {
    const state = {
      ...initialState,
      rightHistory: [
        { id: 201, timestamp: '2026-08-30T09:15:00Z', remark: null, burn: false, launch_number: 201 },
      ],
    };

    const action: WinchAction = {
      type: 'ADD_REMARK',
      payload: { drum: 'right', id: 201, remark: 'Right drum remark' }
    };

    const result = winchReducer(state, action);

    expect(result.rightHistory).toHaveLength(1);
    expect(result.rightHistory[0].remark).toBe('Right drum remark');
    expect(result.leftHistory).toEqual(initialState.leftHistory);
  });
});