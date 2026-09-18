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

// Support official Clerk integration variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) alongside VITE_ prefix
const PUBLISHABLE_KEY =
    import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    import.meta.env.CLERK_PUBLISHABLE_KEY;

const renderApp = () => {
    if (AUTH_PROVIDER === 'clerk' && !PUBLISHABLE_KEY) {
        createRoot(document.getElementById('root')!).render(
            <div style={{
                color: 'white',
                padding: '2rem',
                textAlign: 'center',
                fontFamily: 'sans-serif',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <h2>Clerk Configuration Error</h2>
                <p>Missing Clerk Publishable Key (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY).</p>
            </div>
        );
        return;
    }

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
    // Only initialize MSAL in background if Azure credentials are configured
    if (import.meta.env.VITE_AZURE_CLIENT_ID && import.meta.env.VITE_AZURE_TENANT_ID) {
        msalInstance.initialize().catch(() => {
        });
    }
}
