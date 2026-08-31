import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { ThemeProvider } from '@mui/material/styles';
import { appTheme } from './themes/theme'; // Import your new theme
import { msalInstance } from './features/auth/authConfig';
import App from './features/pages/App.tsx';


// MSAL requires initialization before the provider renders
msalInstance.initialize().then(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <MsalProvider instance={msalInstance}>
                <ThemeProvider theme={appTheme}>
                    <App />
                </ThemeProvider>
            </MsalProvider>
        </StrictMode>
    );
});