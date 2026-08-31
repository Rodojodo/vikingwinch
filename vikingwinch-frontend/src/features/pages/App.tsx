import '../../App.css'
import { Box } from '@mui/material';
import LaunchPanel from './LaunchPanel';

function App() {
    return (
        <Box sx={{ 
            minHeight: '100vh', 
            background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)',
            backgroundAttachment: 'fixed',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 2
        }}>
            <LaunchPanel />
        </Box>
    );
}

export default App;