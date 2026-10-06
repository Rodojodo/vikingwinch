import {useState} from 'react';
import {Alert, Box, Button} from '@mui/material';
import {resetTestvgs} from '../api/resetClient';

type ResetMessage = {
    severity: 'success' | 'error';
    text: string;
};

const DEV_RESET_ENVIRONMENTS = new Set(['local', 'preview']);

export const DevResetDayControl = () => {
    const [message, setMessage] = useState<ResetMessage | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const isAvailable = DEV_RESET_ENVIRONMENTS.has(import.meta.env.VITE_ENVIRONMENT ?? '');

    if (!isAvailable) {
        return null;
    }

    const handleReset = async () => {
        if (!window.confirm('Reset all testvgs operational data to the development starting state?')) {
            return;
        }

        setIsResetting(true);
        setMessage(null);
        try {
            const result = await resetTestvgs();
            setMessage({
                severity: 'success',
                text: `Reset ${result.winches_reset} winches. Finish-day records are dated ${result.finish_day}.`,
            });
        } catch (error) {
            console.error('Failed to reset testvgs development data:', error);
            setMessage({
                severity: 'error',
                text: error instanceof Error ? error.message : 'The development reset failed.',
            });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <Box sx={{display: 'contents'}}>
            <Button
                size="small"
                color="warning"
                variant="outlined"
                disabled={isResetting}
                onClick={handleReset}
                sx={{mr: 1, textTransform: 'none'}}
            >
                {isResetting ? 'Resetting...' : 'DEV ONLY RESET DAY'}
            </Button>
            {message && (
                <Alert
                    severity={message.severity}
                    onClose={() => setMessage(null)}
                    sx={{position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1200, borderRadius: 0}}
                >
                    {message.text}
                </Alert>
            )}
        </Box>
    );
};
