import {Box, Button, Chip, Stack, Typography} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import type {DrumPosition} from '../../winch-ops/types/winchOpsTypes';
import {useEffect, useState} from 'react';
import {burnButtonSx, darkBlueButton, giantLaunchButtonSx, launchCountChipSx} from "../../../themes/styles.ts";

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
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!lastLaunch) return;
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, [lastLaunch]);

    const label = drumType === 'left' ? 'Left Drum' : 'Right Drum';

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
                <Button
                    variant="contained"
                    fullWidth
                    loading={isLoading}
                    disabled={isInteractionDisabled}
                    onClick={onLaunch}
                    sx={giantLaunchButtonSx(drumType === 'left')}
                >
                    {<Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1}}>
                        {label}
                        <Chip
                            label={`${launches} launches`}
                            size="small"
                            sx={launchCountChipSx}
                        />
                    </Box>}
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    loading={isLoading}
                    disabled={isInteractionDisabled}
                    onClick={onBurn}
                    sx={burnButtonSx}
                >
                    <LocalFireDepartmentIcon sx={{fontSize: '16px'}}/> Burn {drumType === 'left' ? 'Left' : 'Right'}
                </Button>
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

            <Typography variant="h4">
                {launches === 0 ? 'Not yet launched' : (lastLaunch ? `Last launch: ${formatTimeAgo(lastLaunch)}` : '')}
            </Typography>
        </Stack>
    );
};