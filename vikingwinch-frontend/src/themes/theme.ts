import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#3b82f6', // The blue used for Left Drum and Remarks/Repairs toggle
            light: '#60a5fa',
            dark: '#2563eb',
        },
        success: {
            main: '#10b981', // The green used for Right Drum and "Turn off winch" sticker
            light: '#34d399',
            dark: '#059669',
        },
        error: {
            main: '#ef4444', // The red used for Burns and "Don't turn off winch" sticker
            light: '#f87171',
            dark: '#dc2626',
        },
        background: {
            default: '#0f172a', // Default dark background
            paper: '#1e293b',   // Slightly lighter background used for panels
        }
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        h2: {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.5px',
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '12px',
                },
            },
        },
    },
});