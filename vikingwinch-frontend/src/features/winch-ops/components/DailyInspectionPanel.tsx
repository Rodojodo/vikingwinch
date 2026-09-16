import React, {useState} from 'react';
import {Box, Button, TextField, Typography} from '@mui/material';
import {getBroughtForward, getWinchHours} from '../api/winchClient.ts';
import {useSessionIdentity} from '../../../app/providers/SessionIdentityProvider.tsx';
import {darkTextFieldStyles, errorBannerSx, glassPanelSx, glowingPrimaryButtonSx} from '../../../themes/styles.ts';
import type {SxProps, Theme} from '@mui/material/styles';

interface DailyInspectionPanelProps {
    onComplete: () => void;
    onSignDI?: (hours: number | null) => Promise<void>;
}

export const DailyInspectionPanel: React.FC<DailyInspectionPanelProps> = ({onComplete, onSignDI}) => {
    const {squadronId, operatorSn, winchId} = useSessionIdentity();
    const [leftDrum, setLeftDrum] = useState<string>('');
    const [rightDrum, setRightDrum] = useState<string>('');
    const [hours, setHours] = useState<string>('');
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRetrieveData = async () => {
        if (!winchId) return;
        setIsFetching(true);
        try {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const bf = await getBroughtForward(winchId, todayStr);
            if (bf.left !== null && bf.left !== undefined) setLeftDrum(bf.left.toString());
            if (bf.right !== null && bf.right !== undefined) setRightDrum(bf.right.toString());
        } catch (e) {
            console.error('Failed to fetch drums', e);
            setError('Failed to retrieve drum totals.');
        }

        try {
            const h = await getWinchHours(winchId);
            if (h.hours !== null && h.hours !== undefined) setHours(h.hours.toString());
        } catch (e) {
            console.error('Failed to fetch hours', e);
            setError('Failed to retrieve winch hours.');
        }
        setIsFetching(false);
    };

    const handleSignDI = async () => {
        if (!winchId || !squadronId || !operatorSn) return;
        setIsSubmitting(true);
        try {
            const parsedHours = hours ? parseFloat(hours) : null;
            const validHours = parsedHours !== null && !isNaN(parsedHours) ? parsedHours : null;
            if (onSignDI) {
                await onSignDI(validHours);
            }
            onComplete();
        } catch (e) {
            console.error('Failed to sign DI', e);
            setError('Failed to submit Daily Inspection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={[glassPanelSx, {maxWidth: 540, gap: 3}] as SxProps<Theme>}>
            {error && (
                <Typography variant="body2" sx={errorBannerSx}>
                    {error}
                </Typography>
            )}
            <Typography variant="h2">
                Winch {winchId}
            </Typography>

            <Typography variant="subtitle1">
                This winch has not been used today. A Daily Inspection is required.
            </Typography>

            <Typography variant="subtitle1">
                Enter the current drum totals.
            </Typography>

            <Button
                variant="outlined"
                color="primary"
                onClick={handleRetrieveData}
                disabled={isFetching}
                sx={{
                    borderRadius: '20px',
                    px: 3,
                    '&:hover': {
                        backgroundColor: (theme) => `${theme.palette.primary.main}1a`,
                    },
                }}
            >
                Retrieve data from cloud
            </Button>

            <Box sx={{display: 'flex', gap: 2, width: '100%'}}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        Left drum total
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 12"
                        value={leftDrum}
                        onChange={(e) => setLeftDrum(e.target.value)}
                        type="number"
                        sx={darkTextFieldStyles}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        Right drum total
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 5"
                        value={rightDrum}
                        onChange={(e) => setRightDrum(e.target.value)}
                        type="number"
                        sx={darkTextFieldStyles}
                    />
                </Box>
            </Box>

            <Box sx={{width: '100%'}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>
                    Hours
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 123.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    type="number"
                    sx={darkTextFieldStyles}
                />
            </Box>

            <Button
                variant="contained"
                color="success"
                disabled={isSubmitting}
                onClick={handleSignDI}
                sx={[
                    glowingPrimaryButtonSx,
                    {py: 2, px: 5},
                ] as SxProps<Theme>}
            >
                Sign DI
            </Button>
        </Box>
    );
};
