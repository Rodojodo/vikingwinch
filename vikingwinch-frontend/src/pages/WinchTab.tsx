import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { LaunchPanel } from '../features/launch-ops/components/LaunchPanel';
import { SkylogValues } from '../features/day-ops/components/SkylogValues';
import { useWinchSession } from '../features/winch-ops/hooks/useWinchSession';
import { WinchSelectPanel } from '../features/winch-ops/components/WinchSelectPanel';
import { SignOnPanel } from '../features/winch-ops/components/SignOnPanel';
import { DailyInspectionPanel } from '../features/winch-ops/components/DailyInspectionPanel';
import { getDayLog } from '../features/winch-ops/api/dataClient';

interface WinchTabProps {
    tabId: string; // <-- New prop
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    onWinchSelect: (tabId: string, winchId: number) => void; // <-- Update signature
}

export const WinchTab = ({ tabId, squadronId, operatorSn, winchId, onWinchSelect }: WinchTabProps) => {
    const [page, setPage] = useState<'launch' | 'skylog'>('launch');
    const [needsSignOn, setNeedsSignOn] = useState<boolean | null>(null);
    const [alreadyInspected, setAlreadyInspected] = useState<boolean | null>(null);
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
            setNeedsSignOn(null);
            setAlreadyInspected(null);
            return;
        }

        const fetchDayLog = async () => {
            try {
                // Get local date in YYYY-MM-DD
                const todayDate = new Date();
                const offset = todayDate.getTimezoneOffset();
                const localDate = new Date(todayDate.getTime() - (offset * 60 * 1000));
                const todayStr = localDate.toISOString().split('T')[0];

                const logs = await getDayLog(session.state.winchId!, todayStr);
                const signOnLogs = logs.filter(l => l.type === 'sign_on');
                const diLogs = logs.filter(l => l.type === 'di');
                
                const hasDiToday = diLogs.length > 0;
                setAlreadyInspected(hasDiToday);
                
                if (signOnLogs.length > 0) {
                    const lastLog = signOnLogs[signOnLogs.length - 1];
                    setLastOperatorSn(lastLog.operator_id);
                    setLastTraineeSn(lastLog.trainee);
                    // Bypass if they were the last person to sign on today
                    if (lastLog.operator_id === operatorSn) {
                        setNeedsSignOn(false);
                    } else {
                        setNeedsSignOn(true);
                    }
                } else {
                    setLastOperatorSn(null);
                    setLastTraineeSn(null);
                    setNeedsSignOn(true);
                }
            } catch (err) {
                console.error("Failed to fetch day logs", err);
                setAlreadyInspected(false);
                setNeedsSignOn(true);
            }
        };
        fetchDayLog();
    }, [session.state.winchId, operatorSn]);


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
            {!session.state.winchId ? (
                <WinchSelectPanel 
                    squadronId={session.state.squadron}
                    onSelectWinch={session.setWinchId}
                />
            ) : alreadyInspected === null || needsSignOn === null ? null : !alreadyInspected ? (
                <DailyInspectionPanel
                    session={session}
                    onComplete={() => setAlreadyInspected(true)}
                />
            ) : needsSignOn ? (
                <SignOnPanel 
                    session={session} 
                    alreadyInspected={alreadyInspected as boolean}
                    lastOperatorSn={lastOperatorSn}
                    lastTraineeSn={lastTraineeSn}
                    onComplete={() => setNeedsSignOn(false)} 
                />
            ) : page === 'launch' ? (
                <LaunchPanel onViewSkylogValues={() => setPage('skylog')} session={session} />
            ) : (
                <SkylogValues 
                    onBack={() => setPage('launch')} 
                    winchId={session.state.winchId}
                    squadron={session.state.squadron}
                    leftLaunches={session.derived.leftLaunches}
                    rightLaunches={session.derived.rightLaunches}
                />
            )}
        </Box>
    );
};
