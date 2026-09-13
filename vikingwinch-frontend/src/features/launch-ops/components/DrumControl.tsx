import {Box, Button, Chip, Stack, Typography, useTheme} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {LaunchButton} from './LaunchButton.tsx';
import type {DrumPosition} from '../../winch-ops/types';
import {useEffect, useState} from 'react';
import {darkBlueButton} from "../../../themes/styles.ts";
import {alpha} from "@mui/material/styles";

function formatTimeAgo(timestamp: string | number | Date): string {
    const time = new Date(timestamp).getTime();
    if (isNaN(time)) return '';

    const diffMs = Date.now() - time;
    if (diffMs < 60000) return 'Just now';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

interface DrumControlProps {
    drumType: DrumPosition;
    launches: number;
    lastLaunch?: string | number | null;
    isLoading: boolean;
    isUsed: boolean;
    isResetting: boolean;
    currentAnim: string;
    onLaunch: () => void;
    onBurn: () => void;
    onUndo: () => void;
}

export const DrumControl = ({
                                drumType,
                                launches,
                                lastLaunch,
                                isLoading,
                                isUsed,
                                isResetting,
                                currentAnim,
                                onLaunch,
                                onBurn,
                                onUndo
                            }: DrumControlProps) => {
    const theme = useTheme();
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!lastLaunch) return;
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, [lastLaunch]);

    const label = drumType === 'left' ? 'Left Drum' : 'Right Drum';

    // Dynamically derive gradients and shadows from the application theme
    const colors = drumType === 'left'
        ? {
            bg: theme.palette.primary.main,
            shadow: alpha(theme.palette.primary.main, 0.4),
            hoverShadow: alpha(theme.palette.primary.main, 0.6)
        }
        : {
            bg: theme.palette.success.main,
            shadow: alpha(theme.palette.success.main, 0.4),
            hoverShadow: alpha(theme.palette.success.main, 0.6)
        };

    const isInteractionDisabled = isLoading || isUsed || isResetting;

    return (
        <Stack spacing={1} sx={{ flex: 1 }}>
            <Stack spacing={1} sx={{
                transition: currentAnim !== 'none' ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isResetting ? 0.3 : (isUsed ? 0.4 : 1),
                transform: (isResetting && isUsed) ? 'scale(0.92)' : (isUsed ? 'scale(0.96)' : 'scale(1)'),
                pointerEvents: isResetting ? 'none' : 'auto',
                animation: currentAnim !== 'none' && !isResetting && !isUsed ? currentAnim : 'none',
            }}>
                <LaunchButton
                    isLoading={isLoading}
                    disabled={isInteractionDisabled}
                    onClick={onLaunch}
                    sx={{
                        backgroundColor: colors.bg, // <-- Changed this line
                        boxShadow: `0 8px 24px ${colors.shadow}`,
                        '&:hover': {
                            boxShadow: `0 12px 32px ${colors.hoverShadow}`,
                            transform: 'translateY(-4px) scale(1.02)'
                        },
                        py: 3.5,
                        px: 2,
                        border: 1,
                        borderColor: 'surface.borderStrong',
                        borderRadius: '20px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    label={
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{label}</Typography>
                            <Chip
                                label={`${launches} launches`}
                                size="small"
                                sx={{
                                    backgroundColor: alpha(theme.palette.common.black, 0.2),
                                    color: 'primary.contrastText',
                                    border: 'none',
                                    px: 1.5, py: 0.5,
                                    height: 'auto',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    borderRadius: '12px'
                                }}
                            />
                        </Box>
                    }
                />

                <LaunchButton
                    isLoading={isLoading}
                    disabled={isInteractionDisabled}
                    onClick={onBurn}
                    mode="burn"
                    sx={{
                        borderRadius: '10px',
                        py: 1,
                        px: 2,
                        border: 1,
                        borderColor: 'error.main',
                        backgroundColor: alpha(theme.palette.error.main, 0.1), // Corrects contrast failure
                        color: 'error.main',
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                            borderColor: 'error.main',
                            color: 'error.main',
                            boxShadow: 'none'
                        }
                    }}
                    label={
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '13px', fontWeight: 600 }}>
                            <LocalFireDepartmentIcon sx={{ fontSize: '16px' }} /> Burn {drumType === 'left' ? 'Left' : 'Right'}
                        </Typography>
                    }
                />
            </Stack>

            <Button
                variant="outlined"
                fullWidth
                disabled={isLoading || launches === 0}
                onClick={onUndo}
                sx={darkBlueButton}
            >
                − Undo {drumType === 'left' ? 'Left' : 'Right'}
            </Button>

            <Typography variant="subtitle2" sx={{fontSize: '14px', textAlign: 'center'}}>
                {launches === 0 ? 'Not yet launched' : (lastLaunch ? `Last launch: ${formatTimeAgo(lastLaunch)}` : '')}
            </Typography>
        </Stack>
    );
};