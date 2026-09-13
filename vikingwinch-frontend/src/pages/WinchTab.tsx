import {useEffect, useState} from 'react';
import {Box} from '@mui/material';
import {LaunchPanel} from '../features/launch-ops/components/LaunchPanel';
import {TraineeWing} from '../features/trainee-ops/components/TraineeWing.tsx'
import {SkylogValues} from '../features/day-ops/components/SkylogValues';
import {useWinchSession} from '../features/winch-ops/hooks/useWinchSession';
import {WinchSelectPanel} from '../features/winch-ops/components/WinchSelectPanel';
import {SignOnPanel} from '../features/day-ops/components/SignOnPanel.tsx';
import {DailyInspectionPanel} from '../features/winch-ops/components/DailyInspectionPanel';
import {getDayLog, getLaunches, getOperatorsForSquadron} from '../features/winch-ops/api/dataClient';
import type {OperatorRead, TabView} from '../features/winch-ops/types'
import {appBackgroundSx} from "../themes/styles.ts";


interface WinchTabProps {
    tabId: string;
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    openWinchIds: number[];
    onWinchSelect: (tabId: string, winchId: number) => void;
}

export const WinchTab = ({ tabId, squadronId, operatorSn, winchId, openWinchIds, onWinchSelect }: WinchTabProps) => {
    const [view, setView] = useState<TabView>('loading');
    const [lastOperatorSn, setLastOperatorSn] = useState<string | null>(null);
    const [lastTraineeSn, setLastTraineeSn] = useState<string | null>(null);
    const [wingOpen, setWingOpen] = useState(false);
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [isFetchingOperators, setIsFetchingOperators] = useState(false);

    const session = useWinchSession(squadronId, operatorSn, winchId);

    useEffect(() => {
        if (session.state.winchId && session.state.winchId !== winchId) {
            onWinchSelect(tabId, session.state.winchId);
        }
    }, [session.state.winchId, winchId, tabId, onWinchSelect]);

    useEffect(() => {
        if (!squadronId) return;
        setIsFetchingOperators(true);
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
        if (!session.state.winchId) {
            setView('select_winch');
            return;
        }

        const fetchDayLog = async () => {
            setView('loading');

            try {
                const todayDate = new Date();
                const offset = todayDate.getTimezoneOffset();
                const localDate = new Date(todayDate.getTime() - (offset * 60 * 1000));
                const todayStr = localDate.toISOString().split('T')[0];

                const [logs, launches] = await Promise.all([
                    getDayLog(session.state.winchId!, todayStr),
                    getLaunches(session.state.winchId!, todayStr)
                ]);

                const traineeSn = logs.findLast(l => l.type === 'sign_on')?.trainee ?? null;
                session.hydrateHistory(launches, traineeSn);
                const signOnLogs = logs.filter(l => l.type === 'sign_on');
                const diLogs = logs.filter(l => l.type === 'di');

                const hasDiToday = diLogs.length > 0;

                if (signOnLogs.length > 0) {
                    const lastLog = signOnLogs[signOnLogs.length - 1];
                    setLastOperatorSn(lastLog.operator_sn);
                    setLastTraineeSn(lastLog.trainee);
                } else {
                    setLastOperatorSn(null);
                    setLastTraineeSn(null);
                }

                if (!hasDiToday) {
                    setView('inspection');
                } else if (signOnLogs.length === 0 || signOnLogs[signOnLogs.length - 1].operator_sn !== operatorSn) {
                    setView('sign_on');
                } else {
                    setView('launch');
                }

            } catch (err) {
                console.error("Failed to fetch day logs", err);
                setView('inspection');
            }
        };

        fetchDayLog();
    }, [session.state.winchId, operatorSn]);

    const operatorName = operators.find(o => o.service_no === session.state.operatorSn)?.name ?? 'Instructor';
    const traineeName = session.state.traineeSn
        ? operators.find(o => o.service_no === session.state.traineeSn)?.name
        : undefined;

    const renderView = () => {
        switch (view) {
            case 'loading':
                return null;
            case 'select_winch':
                return (
                    <WinchSelectPanel
                        squadronId={session.state.squadron}
                        onSelectWinch={session.setWinchId}
                        openWinchIds={openWinchIds}
                    />
                );
            case 'inspection':
                return (
                    <DailyInspectionPanel
                        session={session}
                        onComplete={() => setView('sign_on')}
                    />
                );
            case 'sign_on':
                return (
                    <SignOnPanel
                        session={session}
                        lastOperatorSn={lastOperatorSn}
                        lastTraineeSn={lastTraineeSn}
                        onComplete={() => setView('launch')}
                    />
                );
            case 'launch':
                return (
                    <Box sx={{position: 'relative', width: '100%', maxWidth: 540}}>
                        <LaunchPanel
                            onViewSkylogValues={() => setView('skylog')}
                            session={session}
                        />
                        <TraineeWing
                            open={wingOpen}
                            onToggle={() => setWingOpen(o => !o)}
                            isLoading={session.isLoading}
                            squadron={session.state.squadron}
                            operatorSn={session.state.operatorSn}
                            operatorName={operatorName}
                            traineeSn={session.state.traineeSn}
                            traineeName={traineeName}
                            ActiveDriverSn={session.state.activeLauncherSn}
                            operators={operators}
                            isFetchingOperators={isFetchingOperators}
                            setActiveDriver={session.setActiveLauncher}
                            recordSignOn={session.recordSignOn}
                        />
                    </Box>
                );
            case 'skylog':
                return (
                    <SkylogValues
                        onBack={() => setView('launch')}
                        winchId={session.state.winchId}
                        squadron={session.state.squadron}
                        leftLaunches={session.derived.leftLaunches}
                        rightLaunches={session.derived.rightLaunches}
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
