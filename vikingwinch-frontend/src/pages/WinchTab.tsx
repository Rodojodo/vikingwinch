import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { LaunchPanel } from '../features/launch-ops/components/LaunchPanel';
import { SkylogValues } from '../features/day-ops/components/SkylogValues';
import { useWinchSession } from '../features/winch-ops/hooks/useWinchSession';
import { WinchSelectPanel } from '../features/winch-ops/components/WinchSelectPanel';
import { SignOnPanel } from '../features/winch-ops/components/SignOnPanel';
import { DailyInspectionPanel } from '../features/winch-ops/components/DailyInspectionPanel';
import { getDayLog } from '../features/winch-ops/api/dataClient';
import type { TabView } from '../features/winch-ops/types/index'


interface WinchTabProps {
    tabId: string;
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    onWinchSelect: (tabId: string, winchId: number) => void;
}

export const WinchTab = ({ tabId, squadronId, operatorSn, winchId, onWinchSelect }: WinchTabProps) => {
    const [view, setView] = useState<TabView>('loading');
    const [lastOperatorSn, setLastOperatorSn] = useState<string | null>(null);
    const [lastTraineeSn, setLastTraineeSn] = useState<string | null>(null);
    
    const session = useWinchSession(squadronId, operatorSn, winchId);
    
    useEffect(() => {
        if (session.state.winchId && session.state.winchId !== winchId) {
            onWinchSelect(tabId, session.state.winchId);
        }
    }, [session.state.winchId, winchId, tabId, onWinchSelect]);

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

                const logs = await getDayLog(session.state.winchId!, todayStr);
                const signOnLogs = logs.filter(l => l.type === 'sign_on');
                const diLogs = logs.filter(l => l.type === 'di');
                
                const hasDiToday = diLogs.length > 0;
                
                if (signOnLogs.length > 0) {
                    const lastLog = signOnLogs[signOnLogs.length - 1];
                    setLastOperatorSn(lastLog.operator_id);
                    setLastTraineeSn(lastLog.trainee);
                } else {
                    setLastOperatorSn(null);
                    setLastTraineeSn(null);
                }

                if (!hasDiToday) {
                    setView('inspection');
                } else if (signOnLogs.length === 0 || signOnLogs[signOnLogs.length - 1].operator_id !== operatorSn) {
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



    const renderView = () => {
        switch (view) {
            case 'loading':
                return null;
            case 'select_winch':
                return (
                    <WinchSelectPanel
                        squadronId={session.state.squadron}
                        onSelectWinch={session.setWinchId}
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
                return <LaunchPanel onViewSkylogValues={() => setView('skylog')} session={session} />;
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
        <Box sx={{
            flexGrow: 1,
            background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)',
            backgroundAttachment: 'fixed',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            p: 2,
            pt: 4,
            position: 'relative'
        }}>
            {renderView()}
        </Box>
    );
};
