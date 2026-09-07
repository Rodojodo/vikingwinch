import React from 'react';
import {Box, Button, Typography, Container, Paper} from '@mui/material';
import {useMsal} from '@azure/msal-react';
import winchLogo from '../assets/SkylaunchWinchPixel.png';


export const LoginPage: React.FC = () => {
    const {instance} = useMsal();
    const [error, setError] = React.useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        instance.loginRedirect({scopes: ["User.Read"]}).catch((err) => {
            console.error(err);
            setError("Failed to initiate login. Please try again.");
        });
    };


    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 50% -20%, #1e293b, #0f172a)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Graphic - Left Drum (Primary Blue) */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '40vw',
                    height: '40vw',
                    borderRadius: '50%',
                    border: '2px solid rgba(59, 130, 246, 0.1)',
                    boxShadow: '0 0 100px rgba(59, 130, 246, 0.05)',
                }}
            />
            {/* Background Graphic - Right Drum (Success Green) */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-10%',
                    width: '60vw',
                    height: '60vw',
                    borderRadius: '50%',
                    border: '2px solid rgba(16, 185, 129, 0.1)',
                    boxShadow: '0 0 100px rgba(16, 185, 129, 0.05)',
                }}
            />

            <Container maxWidth="sm" sx={{zIndex: 1}}>
                <Paper
                    elevation={24}
                    sx={{
                        p: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: '24px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    {/* Winch Logo Graphic */}
                    <Box
                        component="img"
                        src={winchLogo}
                        alt="Winch Logo"
                        sx={{
                            width: 120,
                            height: 120,
                            mb: 3,
                            objectFit: 'contain'
                        }}
                    />

                    <Typography variant="h3" component="h1" gutterBottom
                                sx={{fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#fff'}}>
                        Winch Log Keeper
                    </Typography>

                    <Typography variant="body1" sx={{mb: 4, color: '#94a3b8', textAlign: 'center'}}>
                        Welcome back. Please sign in with your Microsoft account to continue to the winch operations
                        dashboard.
                    </Typography>

                    {error && (
                        <Typography color="error" sx={{ mb: 3, textAlign: 'center' }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleLogin}
                        sx={{
                            py: 1.5,
                            px: 4,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            borderRadius: '12px',
                            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 24px rgba(59, 130, 246, 0.6)',
                                background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
                            }
                        }}
                    >
                        Sign in with Microsoft
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};
