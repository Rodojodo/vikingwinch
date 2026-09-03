import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import { appTheme } from './themes/theme'; // Import your new theme
import { msalInstance } from './features/auth/config/authConfig';
import App from './pages/App.tsx';


// MSAL requires initialization before the provider renders
msalInstance.initialize().then(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <MsalProvider instance={msalInstance}>
                <ThemeProvider theme={appTheme}>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </MsalProvider>
        </StrictMode>
    );
});