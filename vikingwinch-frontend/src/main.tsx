import {ClerkProvider} from '@clerk/react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MsalProvider} from '@azure/msal-react';
import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import {appTheme} from './themes/theme'; // Import your new theme
import {msalInstance} from './features/auth/config/authConfig';
import App, {AUTH_PROVIDER} from './pages/App.tsx';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const renderApp = () => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
                {/* MSAL Provider kept intact if MSAL provider is selected */}
                <MsalProvider instance={msalInstance}>
                    <ThemeProvider theme={appTheme}>
                        <CssBaseline/>
                        <App/>
                    </ThemeProvider>
                </MsalProvider>
            </ClerkProvider>
        </StrictMode>
    );
};

// Default to Clerk across all environments (including production).
// Only block on MSAL initialization if MSAL is explicitly selected.
if (AUTH_PROVIDER === 'msal') {
    msalInstance.initialize().catch((err) => {
        console.warn("MSAL initialization failed:", err);
    }).finally(() => {
        renderApp();
    });
} else {
    // Render app immediately with Clerk
    renderApp();
    // Non-blocking background MSAL initialization
    msalInstance.initialize().catch(() => {
    });
}
