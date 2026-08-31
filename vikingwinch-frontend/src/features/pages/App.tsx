import { useState } from 'react';
import '../../App.css'
import { Box } from '@mui/material';
import LaunchPanel from './LaunchPanel';
import SkylogValues from './SkylogValues';

function App() {
    const [page, setPage] = useState<'launch' | 'skylog'>('launch');

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
                <LaunchPanel onViewSkylogValues={() => setPage('skylog')} />
            ) : (
                <SkylogValues onBack={() => setPage('launch')} />
            )}
        </Box>
    );
}

export default App;