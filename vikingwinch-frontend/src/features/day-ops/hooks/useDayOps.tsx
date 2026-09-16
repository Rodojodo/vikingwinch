import React, {createContext, useCallback, useContext, useReducer} from 'react';
import {dayReducer, initialDayOpsState} from '../state/dayReducer';
import {postDayLogToDb} from '../api/dayOpsClient';
import {useSessionIdentity} from '../../../app/providers/SessionIdentityProvider';

interface DayOpsContextType {
    dayFinished: boolean;
    signedOn: boolean;
    diCompleted: boolean;
    lastOperatorSn: string | null;
    lastTraineeSn: string | null;
    finishDay: (cableCheck?: string | null, hours?: number | null) => Promise<void>;
    recordSignOn: (traineeSn: string | null) => Promise<void>;
    recordDI: (cableCheck?: string | null, hours?: number | null) => Promise<void>;
    resetDay: () => void;
}

const DayOpsContext = createContext<DayOpsContextType | null>(null);

export const DayOpsProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [state, dispatch] = useReducer(dayReducer, initialDayOpsState);
    const {winchId, squadronId, operatorSn} = useSessionIdentity();

    const finishDay = useCallback(async (cableCheck: string | null = null, hours: number | null = null) => {
        if (!winchId || !squadronId || !operatorSn) {
            throw new Error('Incomplete session identity for finishDay');
        }
        await postDayLogToDb({
            squadron_id: squadronId,
            winch_id: winchId,
            operator_sn: operatorSn,
            trainee: null,
            type: 'finish_day',
            cable_check: cableCheck,
            hours,
        });
        dispatch({type: 'FINISH_DAY'});
    }, [winchId, squadronId, operatorSn]);

    const recordSignOn = useCallback(async (traineeSn: string | null) => {
        if (!winchId || !squadronId || !operatorSn) {
            throw new Error('Incomplete session identity for sign on');
        }
        await postDayLogToDb({
            squadron_id: squadronId,
            winch_id: winchId,
            operator_sn: operatorSn,
            trainee: traineeSn,
            type: 'sign_on',
            cable_check: null,
            hours: null,
        });
        dispatch({type: 'RECORD_SIGN_ON', payload: {operatorSn, traineeSn}});
    }, [winchId, squadronId, operatorSn]);

    const recordDI = useCallback(async (cableCheck: string | null = null, hours: number | null = null) => {
        if (!winchId || !squadronId || !operatorSn) {
            throw new Error('Incomplete session identity for DI');
        }
        await postDayLogToDb({
            squadron_id: squadronId,
            winch_id: winchId,
            operator_sn: operatorSn,
            trainee: null,
            type: 'di',
            cable_check: cableCheck,
            hours,
        });
        dispatch({type: 'RECORD_DI'});
    }, [winchId, squadronId, operatorSn]);

    const resetDay = useCallback(() => {
        dispatch({type: 'RESET_DAY'});
    }, []);

    return (
        <DayOpsContext.Provider value={{
            dayFinished: state.dayFinished,
            signedOn: state.signedOn,
            diCompleted: state.diCompleted,
            lastOperatorSn: state.lastOperatorSn,
            lastTraineeSn: state.lastTraineeSn,
            finishDay,
            recordSignOn,
            recordDI,
            resetDay,
        }}>
            {children}
        </DayOpsContext.Provider>
    );
};

export const useDayOps = () => {
    const context = useContext(DayOpsContext);
    if (!context) {
        throw new Error('useDayOps must be used within DayOpsProvider');
    }
    return context;
};
