import {SessionIdentityProvider} from '../app/providers/SessionIdentityProvider.tsx';
import {useSessionIdentity} from '../app/hooks/useSessionIdentity.ts';
import {LaunchOpsProvider} from '../features/launch-ops/providers/LaunchOpsProvider.tsx';
import {useLaunchOps} from '../features/launch-ops/hooks/useLaunchOps.ts';
import {TraineeOpsProvider} from '../features/trainee-ops/providers/TraineeOpsProvider.tsx';
import {useTraineeOps} from '../features/trainee-ops/hooks/useTraineeOps.ts';
import {DayOpsProvider} from '../features/day-ops/providers/DayOpsProvider.tsx';
import {useDayOps} from '../features/day-ops/hooks/useDayOps.ts';
import {RemarksRepairsPanel} from '../features/remarks-repairs/components/RemarksRepairsPanel.tsx';
import {FinishDayPanel} from '../features/day-ops/components/FinishDayPanel.tsx';
import {useCallback, useEffect, useState} from 'react';
import {Box, ButtonBase} from '@mui/material';
import {LaunchPanel} from '../features/launch-ops/components/LaunchPanel';
import {TraineeWing} from '../features/trainee-ops/components/TraineeWing.tsx';
import {TraineeAssignmentPanel} from '../features/trainee-ops/components/TraineeAssignmentPanel.tsx';
import {SkylogValues} from '../features/day-ops/components/SkylogValues';

import {WinchSelectPanel} from '../features/winch-ops/components/WinchSelectPanel';
import {SignOnPanel} from '../features/day-ops/components/SignOnPanel.tsx';
import {DailyInspectionPanel} from '../features/winch-ops/components/DailyInspectionPanel';
import {getDayLog} from '../features/day-ops/api/dayOpsClient.ts';
import {toDayLogRecord} from '../features/day-ops/api/dayOpsMapper.ts';
import {getLaunches} from '../features/launch-ops/api/launchClient.ts';
import {postRemarkToDb} from '../features/remarks-repairs/api/remarksClient.ts';
import {getOperatorsForSquadron} from '../core/http/operatorsClient.ts';
import {exportLog} from '../app/utils/exportLog.ts';
import type {SessionStatus} from '../app/types/session.ts';
import type {TabView} from '../features/winch-ops/types';
import type {OperatorRead} from '../core/types';
import {appBackgroundSx, getTabButtonStyles} from '../themes/styles.ts';

interface WinchTabProps {
    tabId: string;
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    openWinchIds: number[];
    onWinchSelect: (tabId: string, winchId: number) => void;
}

interface WinchTabContentProps {
    tabId: string;
    openWinchIds: number[];
    onWinchSelect: (tabId: string, winchId: number) => void;
    onSessionStatusResolved: (status: 'open' | 'closed') => void;
}

const WinchTabContent = ({
                             tabId,
                             openWinchIds,
                             onWinchSelect,
                             onSessionStatusResolved,
                         }: WinchTabContentProps) => {
    const {squadronId, winchId, operatorSn, status} = useSessionIdentity();
    const {hydrateHistory, derived, addRemarkToState, leftHistory, rightHistory} = useLaunchOps();
    const {traineeSn, activeLauncherSn, setActiveLauncher, setTrainee} = useTraineeOps();
    const {recordDI, recordSignOn} = useDayOps();
    const [view, setView] = useState<TabView>(() => (winchId ? 'loading' : 'select_winch'));
    const [prevWinchId, setPrevWinchId] = useState(winchId);
    if (winchId !== prevWinchId) {
        setPrevWinchId(winchId);
        setView(winchId ? 'loading' : 'select_winch');
    }

    const [lastOperatorSn, setLastOperatorSn] = useState<string | null>(null);
    const [lastTraineeSn, setLastTraineeSn] = useState<string | null>(null);
    const [wingOpen, setWingOpen] = useState(false);
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [isFetchingOperators, setIsFetchingOperators] = useState(false);
    const [prevSqn, setPrevSqn] = useState(squadronId);
    if (squadronId !== prevSqn) {
        setPrevSqn(squadronId);
        if (squadronId) {
            setIsFetchingOperators(true);
        }
    }

    useEffect(() => {
        if (!squadronId) return;
        const controller = new AbortController();
        getOperatorsForSquadron(squadronId, controller.signal)
            .then(data => {
                if (!controller.signal.aborted) setOperators(data);
            })
            .catch(console.error)
            .finally(() => {
                if (!controller.signal.aborted) setIsFetchingOperators(false);
            });
        return () => controller.abort();
    }, [squadronId]);

    useEffect(() => {
        if (!winchId) {
            return;
        }

        let isMounted = true;
        const currentWinchId = winchId;
        const fetchDayLog = async () => {
            try {
                const todayDate = new Date();
                const offset = todayDate.getTimezoneOffset();
                const localDate = new Date(todayDate.getTime() - (offset * 60 * 1000));
                const todayStr = localDate.toISOString().split('T')[0];

                const [rawLogs, rawLaunches] = await Promise.all([
                    getDayLog(currentWinchId, todayStr),
                    getLaunches(currentWinchId, todayStr),
                ]);

                if (!isMounted) return;

                const logs = (rawLogs || []).map(toDayLogRecord);
                const launches = rawLaunches || [];
                const lastTrainee = logs.findLast(l => l.type === 'sign_on')?.traineeSn ?? null;
                hydrateHistory(launches);
                setTrainee(lastTrainee);
                const signOnLogs = logs.filter(l => l.type === 'sign_on');
                const diLogs = logs.filter(l => l.type === 'di');

                const hasDiToday = diLogs.length > 0;
                const isDayFinished = logs.some(l => l.type === 'finish_day');

                onSessionStatusResolved(isDayFinished ? 'closed' : 'open');

                if (signOnLogs.length > 0) {
                    const lastLog = signOnLogs[signOnLogs.length - 1];
                    setLastOperatorSn(lastLog.operatorSn);
                    setLastTraineeSn(lastLog.traineeSn);
                } else {
                    setLastOperatorSn(null);
                    setLastTraineeSn(null);
                }

                if (!hasDiToday) {
                    setView('inspection');
                } else if (signOnLogs.length === 0 || signOnLogs[signOnLogs.length - 1].operatorSn !== operatorSn) {
                    setView('sign_on');
                } else {
                    setView('launch');
                }

            } catch (err) {
                if (isMounted) {
                    console.error('Failed to fetch day logs', err);
                    onSessionStatusResolved('open');
                    setView('inspection');
                }
            }
        };

        fetchDayLog();
        return () => {
            isMounted = false;
        };
    }, [winchId, operatorSn, hydrateHistory, setTrainee, onSessionStatusResolved]);

    const addRemark = async (remark: string | null, drum: 'left' | 'right') => {
        if (!winchId) return;
        const record = drum === 'left' ? derived.leftLastRecord : derived.rightLastRecord;
        if (!record) throw new Error('No launch record found to remark');
        const newRemarkStr = record.remark ? `${record.remark} | ${remark}` : remark;
        await postRemarkToDb({launch_id: record.id, winch_id: winchId, remark: newRemarkStr});
        addRemarkToState(drum, record.id, newRemarkStr);
    };

    const handleExportLog = async () => {
        await exportLog({
            squadron: squadronId ?? '',
            winchId,
            operatorSn: operatorSn ?? '',
            traineeSn,
            leftHistory,
            rightHistory,
            dayFinished: status.status === 'closed',
            activeLauncherSn: activeLauncherSn || (operatorSn ?? ''),
        });
    };

    const operatorName = operators.find(o => o.service_no === operatorSn)?.name ?? 'Instructor';
    const traineeName = traineeSn
        ? operators.find(o => o.service_no === traineeSn)?.name
        : undefined;

    const renderView = () => {
        switch (view) {
            case 'loading':
                return null;
            case 'select_winch':
                return (
                    <WinchSelectPanel
                        squadronId={squadronId}
                        onSelectWinch={(newWinchId) => onWinchSelect(tabId, newWinchId)}
                        openWinchIds={openWinchIds}
                    />
                );
            case 'inspection':
                return (
                    <DailyInspectionPanel
                        onComplete={() => setView('sign_on')}
                        onSignDI={async (hours) => {
                            await recordDI(null, hours);
                        }}
                    />
                );
            case 'sign_on':
                return (
                    <SignOnPanel
                        lastOperatorSn={lastOperatorSn}
                        lastTraineeSn={lastTraineeSn}
                        onComplete={() => setView('launch')}
                        onSetTrainee={setTrainee}
                    />
                );
            case 'launch':
                return (
                    <Box sx={{position: 'relative', width: '100%', maxWidth: 540}}>
                        <LaunchPanel>
                            <RemarksRepairsPanel addRemark={addRemark} squadronId={squadronId} isLoading={false} derived={derived} />
                            <ButtonBase
                                onClick={() => setView('skylog')}
                                sx={getTabButtonStyles(false)}
                            >
                                Show skylog values
                            </ButtonBase>
                            <FinishDayPanel isLoading={false} onExportLog={handleExportLog}/>
                        </LaunchPanel>
                        <TraineeWing
                            open={wingOpen}
                            onToggle={() => setWingOpen(o => !o)}
                            isLoading={false}
                            squadron={squadronId}
                            operatorSn={operatorSn}
                            operatorName={operatorName}
                            traineeSn={traineeSn}
                            traineeName={traineeName}
                            ActiveDriverSn={activeLauncherSn || operatorSn}
                            operators={operators}
                            isFetchingOperators={isFetchingOperators}
                            setActiveDriver={setActiveLauncher}
                        >
                            <TraineeAssignmentPanel
                                isLoading={false}
                                recordSignOn={async (newTraineeSn) => {
                                    if (operatorSn) {
                                        await recordSignOn(newTraineeSn);
                                        setTrainee(newTraineeSn);
                                    }
                                }}
                                squadron={squadronId}
                                operatorSn={operatorSn}
                                traineeSn={traineeSn}
                            />
                        </TraineeWing>
                    </Box>
                );
            case 'skylog':
                return (
                    <SkylogValues
                        onBack={() => setView('launch')}
                        winchId={winchId}
                        squadron={squadronId}
                        leftLaunches={derived.leftLaunches}
                        rightLaunches={derived.rightLaunches}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={appBackgroundSx}>
            {renderView()}
        </Box>
    );
};

const WinchTabInner = ({
    tabId,
    openWinchIds,
    onWinchSelect,
    onSessionStatusResolved,
}: WinchTabContentProps) => {
    const { traineeSn, activeLauncherSn } = useTraineeOps();
    return (
        <LaunchOpsProvider traineeSn={traineeSn} activeLauncherSn={activeLauncherSn}>
            <WinchTabContent
                tabId={tabId}
                openWinchIds={openWinchIds}
                onWinchSelect={onWinchSelect}
                onSessionStatusResolved={onSessionStatusResolved}
            />
        </LaunchOpsProvider>
    );
};

export const WinchTab = (props: WinchTabProps) => {
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>(() =>
        props.winchId !== null
            ? { status: 'hydrating', winchId: props.winchId }
            : { status: 'unselected' }
    );
    const [prevWinchId, setPrevWinchId] = useState(props.winchId);

    if (props.winchId !== prevWinchId) {
        setPrevWinchId(props.winchId);
        setSessionStatus(
            props.winchId !== null
                ? { status: 'hydrating', winchId: props.winchId }
                : { status: 'unselected' }
        );
    }

    const handleSessionStatusResolved = useCallback((status: 'open' | 'closed') => {
        if (props.winchId !== null) {
            setSessionStatus({ status, winchId: props.winchId });
        }
    }, [props.winchId]);

    const handleDayFinished = useCallback(() => {
        if (props.winchId !== null) {
            setSessionStatus({ status: 'closed', winchId: props.winchId });
        }
    }, [props.winchId]);

    const { onWinchSelect } = props;
    const handleWinchSelect = useCallback((tabId: string, newWinchId: number) => {
        setSessionStatus({ status: 'hydrating', winchId: newWinchId });
        onWinchSelect(tabId, newWinchId);
    }, [onWinchSelect]);

    return (
        <SessionIdentityProvider
            squadronId={props.squadronId}
            operatorSn={props.operatorSn}
            status={sessionStatus}
        >
            <DayOpsProvider onDayFinished={handleDayFinished}>
                <TraineeOpsProvider>
                    <WinchTabInner
                        tabId={props.tabId}
                        openWinchIds={props.openWinchIds}
                        onWinchSelect={handleWinchSelect}
                        onSessionStatusResolved={handleSessionStatusResolved}
                    />
                </TraineeOpsProvider>
            </DayOpsProvider>
        </SessionIdentityProvider>
    );
};
