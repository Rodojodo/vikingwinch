import {describe, expect, it} from 'vitest';
import {dayReducer, initialDayOpsState} from './dayReducer';

describe('dayReducer', () => {
    it('returns default initial state for unknown action', () => {
        const unknownAction = {type: 'UNKNOWN'} as never;
        const state = dayReducer(initialDayOpsState, unknownAction);
        expect(state).toEqual(initialDayOpsState);
    });

    it('handles FINISH_DAY', () => {
        const state = dayReducer(initialDayOpsState, {type: 'FINISH_DAY'});
        expect(state.dayFinished).toBe(true);
    });

    it('handles RECORD_SIGN_ON', () => {
        const state = dayReducer(initialDayOpsState, {
            type: 'RECORD_SIGN_ON',
            payload: {operatorSn: 'OP1', traineeSn: 'TR1'},
        });
        expect(state.signedOn).toBe(true);
        expect(state.lastOperatorSn).toBe('OP1');
        expect(state.lastTraineeSn).toBe('TR1');
    });

    it('handles RECORD_DI', () => {
        const state = dayReducer(initialDayOpsState, {type: 'RECORD_DI'});
        expect(state.diCompleted).toBe(true);
    });

    it('handles RESET_DAY', () => {
        const modifiedState = {
            dayFinished: true,
            signedOn: true,
            diCompleted: true,
            lastOperatorSn: 'OP1',
            lastTraineeSn: 'TR1',
        };
        const state = dayReducer(modifiedState, {type: 'RESET_DAY'});
        expect(state).toEqual(initialDayOpsState);
    });
});
