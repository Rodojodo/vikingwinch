import {describe, expect, it} from 'vitest';
import {initialLaunchState, launchReducer, type LaunchState} from './launchReducer';
import type {LaunchRecord} from '../types';

describe('launchReducer', () => {
    const baseRecord: LaunchRecord = {
        id: 1,
        launch_number: 10,
        timestamp: '2026-09-16T09:00:00Z',
        remark: null,
        burn: false,
        operator_sn: 'OP-123',
    };

    it('returns default initial state for unknown action', () => {
        const unknownAction = {type: 'UNKNOWN'} as never;
        const state = launchReducer(initialLaunchState, unknownAction);
        expect(state).toEqual(initialLaunchState);
    });

    describe('RECORD_LAUNCH', () => {
        it('appends normal launch to leftHistory with burn false', () => {
            const state = launchReducer(initialLaunchState, {
                type: 'RECORD_LAUNCH',
                payload: {drum: 'left', record: {...baseRecord, launch_number: 1}},
            });

            expect(state.leftHistory).toHaveLength(1);
            expect(state.leftHistory[0]).toEqual({
                id: 1,
                launch_number: 1,
                timestamp: '2026-09-16T09:00:00Z',
                remark: null,
                burn: false,
                operator_sn: 'OP-123',
            });
            expect(state.rightHistory).toHaveLength(0);
        });

        it('appends burn launch to rightHistory with burn true', () => {
            const state = launchReducer(initialLaunchState, {
                type: 'RECORD_LAUNCH',
                payload: {drum: 'right', record: {...baseRecord, id: 2, launch_number: null, burn: true}},
            });

            expect(state.rightHistory).toHaveLength(1);
            expect(state.rightHistory[0]).toEqual({
                id: 2,
                launch_number: null,
                timestamp: '2026-09-16T09:00:00Z',
                remark: null,
                burn: true,
                operator_sn: 'OP-123',
            });
            expect(state.leftHistory).toHaveLength(0);
        });
    });

    describe('UNDO_LAUNCH', () => {
        const prefilledState: LaunchState = {
            leftHistory: [
                { id: 1, launch_number: 1, timestamp: '10:00', remark: null, burn: false, operator_sn: 'OP1' },
                { id: 2, launch_number: 2, timestamp: '10:15', remark: null, burn: false, operator_sn: 'OP1' },
            ],
            rightHistory: [
                { id: 3, launch_number: 3, timestamp: '10:10', remark: null, burn: false, operator_sn: 'OP1' },
            ],
        };

        it('removes the last entry from leftHistory', () => {
            const state = launchReducer(prefilledState, {
                type: 'UNDO_LAUNCH',
                payload: { drum: 'left' },
            });

            expect(state.leftHistory).toHaveLength(1);
            expect(state.leftHistory[0].id).toBe(1);
            expect(state.rightHistory).toHaveLength(1);
        });

        it('removes the last entry from rightHistory', () => {
            const state = launchReducer(prefilledState, {
                type: 'UNDO_LAUNCH',
                payload: { drum: 'right' },
            });

            expect(state.rightHistory).toHaveLength(0);
            expect(state.leftHistory).toHaveLength(2);
        });

        it('handles undo when history is already empty', () => {
            const state = launchReducer(initialLaunchState, {
                type: 'UNDO_LAUNCH',
                payload: { drum: 'left' },
            });

            expect(state.leftHistory).toEqual([]);
        });
    });

    describe('HYDRATE_HISTORY', () => {
        it('hydrates left and right histories', () => {
            const leftRecords: LaunchRecord[] = [
                {...baseRecord, id: 1, launch_number: 1},
                {...baseRecord, id: 3, launch_number: 2, remark: 'Cable knot'},
            ];
            const rightRecords: LaunchRecord[] = [
                {...baseRecord, id: 2, launch_number: null, burn: true},
            ];

            const state = launchReducer(initialLaunchState, {
                type: 'HYDRATE_HISTORY',
                payload: {left: leftRecords, right: rightRecords},
            });

            expect(state.leftHistory).toHaveLength(2);
            expect(state.leftHistory[0].id).toBe(1);
            expect(state.leftHistory[0].burn).toBe(false);
            expect(state.leftHistory[1].id).toBe(3);
            expect(state.leftHistory[1].remark).toBe('Cable knot');

            expect(state.rightHistory).toHaveLength(1);
            expect(state.rightHistory[0].id).toBe(2);
            expect(state.rightHistory[0].burn).toBe(true);
        });
    });

    describe('ADD_REMARK', () => {
        const prefilledState: LaunchState = {
            leftHistory: [
                { id: 10, launch_number: 1, timestamp: '10:00', remark: null, burn: false, operator_sn: 'OP1' },
                { id: 20, launch_number: 2, timestamp: '10:15', remark: null, burn: false, operator_sn: 'OP1' },
            ],
            rightHistory: [
                { id: 30, launch_number: 3, timestamp: '10:10', remark: null, burn: false, operator_sn: 'OP1' },
            ],
        };

        it('adds remark to specified launch on left drum', () => {
            const state = launchReducer(prefilledState, {
                type: 'ADD_REMARK',
                payload: { drum: 'left', id: 20, remark: 'Weak link replaced' },
            });

            expect(state.leftHistory[1].remark).toBe('Weak link replaced');
            expect(state.leftHistory[0].remark).toBeNull();
        });

        it('adds remark to specified launch on right drum', () => {
            const state = launchReducer(prefilledState, {
                type: 'ADD_REMARK',
                payload: { drum: 'right', id: 30, remark: 'Slow retrieve' },
            });

            expect(state.rightHistory[0].remark).toBe('Slow retrieve');
        });

        it('leaves history unchanged if id is not found', () => {
            const state = launchReducer(prefilledState, {
                type: 'ADD_REMARK',
                payload: { drum: 'left', id: 999, remark: 'Non-existent' },
            });

            expect(state.leftHistory).toEqual(prefilledState.leftHistory);
        });
    });
});
