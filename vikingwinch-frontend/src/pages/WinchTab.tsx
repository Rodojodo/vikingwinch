import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { LaunchPanel } from '../features/launch-ops/components/LaunchPanel';
import { SkylogValues } from '../features/day-ops/components/SkylogValues';
import { useWinchSession } from '../features/winch-ops/hooks/useWinchSession';
import { WinchSelectPanel } from '../features/winch-ops/components/WinchSelectPanel';

interface WinchTabProps {
    squadronId: string;
    operatorSn: string;
    winchId: number | null;
    onWinchSelect: (winchId: number) => void;
}

export const WinchTab = ({ squadronId, operatorSn, winchId, onWinchSelect }: WinchTabProps) => {
    const [page, setPage] = useState<'launch' | 'skylog'>('launch');
    const session = useWinchSession(squadronId, operatorSn, winchId);

    useEffect(() => {
        if (session.state.winchId && session.state.winchId !== winchId) {
            onWinchSelect(session.state.winchId);
        }
    }, [session.state.winchId, winchId, onWinchSelect]);

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
