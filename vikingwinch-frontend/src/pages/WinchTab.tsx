import { useState } from 'react';
import { Box } from '@mui/material';
import { LaunchPanel } from '../features/launch-ops/components/LaunchPanel';
import { SkylogValues } from '../features/day-ops/components/SkylogValues';
import { useWinchSession } from '../features/winch-ops/hooks/useWinchSession';

export const WinchTab = () => {
    const [page, setPage] = useState<'launch' | 'skylog'>('launch');
    const session = useWinchSession();

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)',
            backgroundAttachment: 'fixed',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            p: 2,
            pt: 12,
            position: 'relative'
        }}>
            {page === 'launch' ? (
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
