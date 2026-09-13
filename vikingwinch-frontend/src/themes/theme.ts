import {createTheme} from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        surface: {
            card: string;
            cardLight: string; // <-- Added here
            border: string;
            borderStrong: string;
        };
    }

    interface PaletteOptions {
        surface?: {
            card?: string;
            cardLight?: string; // <-- Added here
            border?: string;
            borderStrong?: string;
        };
    }
}

export const appTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#3478f3',
            light: '#5f93f6',
            dark: '#2860c9',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#ffffff08',
            light: '#8896a8',
            dark: '#334155cc',
            contrastText: '#ffffff',
        },
        success: {
            main: '#4caf50',
            light: '#3fc79a',
            dark: '#4caf5033',
            contrastText: '#ffffff',
        },
        error: {
            main: '#ef4444',
            light: '#ef444414',
            dark: '#ef444433',
        },
        background: {
            default: '#0f172a',
            paper: '#1b243a',
        },
        surface: {
            card: '#1b243a',
            cardLight: '#232f48', // <-- The slightly lighter color for nested panels
            border: '#313a4c',
            borderStrong: 'rgba(255, 255, 255, 0.15)',
        },
        text: {
            primary: '#ffffff',
            secondary: '#94a3b8',
        },
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        h2: {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '48px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
        },
        subtitle2: {
            fontSize: '18px', // Standard MUI size for subtitle2, adjust if needed
            fontWeight: 500,
            color: '#8b9bb4', // Standardizes your specific label color
        },
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
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    '&:hover': {
                        backgroundColor: '#ffffff14',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
});