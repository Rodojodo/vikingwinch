import {SessionIdentityProvider, useSessionIdentity} from "../app/providers/SessionIdentityProvider.tsx";
import {LaunchOpsProvider, useLaunchOps} from "../features/launch-ops/hooks/useLaunchOps.tsx";
import {TraineeOpsProvider, useTraineeOps} from "../features/trainee-ops/hooks/useTraineeOps.tsx";
import {RemarksRepairsPanel} from "../features/remarks-repairs/components/RemarksRepairsPanel.tsx";
import {FinishDayPanel} from "../features/day-ops/components/FinishDayPanel.tsx";
import {useEffect, useState} from 'react';
import {Box} from '@mui/material';
import {LaunchPanel} from '../features/launch-ops/components/LaunchPanel';
import {TraineeWing} from '../features/trainee-ops/components/TraineeWing.tsx'
import {SkylogValues} from '../features/day-ops/components/SkylogValues';

import {WinchSelectPanel} from '../features/winch-ops/components/WinchSelectPanel';
import {SignOnPanel} from '../features/day-ops/components/SignOnPanel.tsx';
import {DailyInspectionPanel} from '../features/winch-ops/components/DailyInspectionPanel';
import {getDayLog} from '../features/day-ops/api/dayOpsClient.ts';
import {getLaunches} from '../features/launch-ops/api/launchClient.ts';
import {getOperatorsForSquadron} from '../core/http/operatorsClient.ts';
import type {TabView} from '../features/winch-ops/types';
import type {OperatorRead} from '../core/types';
import {appBackgroundSx} from "../themes/styles.ts";


interface WinchTabProps {
    tabId: string;
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    openWinchIds: number[];
    onWinchSelect: (tabId: string, winchId: number) => void;
}

const WinchTabContent = ({ tabId, openWinchIds, onWinchSelect }: Omit<WinchTabProps, "squadronId" | "operatorSn" | "winchId">) => {
    const {squadronId, winchId, operatorSn} = useSessionIdentity();
    const {hydrateHistory, derived, addRemarkToState} = useLaunchOps();
    const {traineeSn, activeLauncherSn, setActiveLauncher, setTrainee} = useTraineeOps();
    const [view, setView] = useState<TabView>('loading');
    const [lastOperatorSn, setLastOperatorSn] = useState<string | null>(null);
    const [lastTraineeSn, setLastTraineeSn] = useState<string | null>(null);
    const [wingOpen, setWingOpen] = useState(false);
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [isFetchingOperators, setIsFetchingOperators] = useState(false);


    useEffect(() => {
        if (winchId && winchId !== winchId) {
            onWinchSelect(tabId, winchId);
        }
    }, [winchId, winchId, tabId, onWinchSelect]);

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
        if (!winchId) {
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
                    getDayLog(winchId!, todayStr),
                    getLaunches(winchId!, todayStr)
                ]);

                const traineeSn = logs.findLast(l => l.type === 'sign_on')?.trainee ?? null;
                hydrateHistory(launches); setTrainee(traineeSn);
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
    }, [winchId, operatorSn]);

    const addRemark = async (remark: string | null, drum: "left" | "right") => {
        if (!winchId) return;
        const record = drum === "left" ? derived.leftLastRecord : derived.rightLastRecord;
        if (!record) throw new Error("No launch record found to remark");
        const newRemarkStr = record.remark ? `${record.remark} | ${remark}` : remark;
        await import("../features/remarks-repairs/api/remarksClient").then(m => m.postRemarkToDb({launch_id: record.id, winch_id: winchId, remark: newRemarkStr}));
        addRemarkToState(drum, record.id, newRemarkStr);
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
                    />
                );
            case 'sign_on':
                return (
                    <SignOnPanel
                        
                        lastOperatorSn={lastOperatorSn}
                        lastTraineeSn={lastTraineeSn}
                        onComplete={() => setView('launch')}
                    />
                );
            case 'launch':
                return (
                    <Box sx={{position: 'relative', width: '100%', maxWidth: 540}}>
                        <LaunchPanel
                        >
                            <RemarksRepairsPanel addRemark={addRemark} squadronId={squadronId} isLoading={false} derived={derived} />
                            <FinishDayPanel isLoading={false} />
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
                            
                        />
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

export const WinchTab = (props: WinchTabProps) => {
    return (
        <SessionIdentityProvider squadronId={props.squadronId} operatorSn={props.operatorSn} winchId={props.winchId}>
            <TraineeOpsProvider>
                <LaunchOpsProvider>
                    <WinchTabContent tabId={props.tabId} openWinchIds={props.openWinchIds} onWinchSelect={props.onWinchSelect} />
                </LaunchOpsProvider>
            </TraineeOpsProvider>
        </SessionIdentityProvider>
    );
};

