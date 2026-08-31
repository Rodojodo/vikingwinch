import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { msalInstance } from './features/auth/authConfig';
import App from './features/pages/App.tsx';

const theme = createTheme({
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        h2: {
            fontFamily: '"Outfit", sans-serif',
        }
    }
});

// MSAL requires initialization before the provider renders
msalInstance.initialize().then(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <MsalProvider instance={msalInstance}>
                <ThemeProvider theme={theme}>
                    <App />
                </ThemeProvider>
            </MsalProvider>
        </StrictMode>
    );
});