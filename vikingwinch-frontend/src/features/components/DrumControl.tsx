import { Box, Stack, Typography, Chip, Button } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { LaunchButton } from '../components/LaunchButton';
import type { DrumPosition } from '../types';

interface DrumControlProps {
    drumType: DrumPosition;
    launches: number;
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
    isLoading,
    isUsed,
    isResetting,
    currentAnim,
    onLaunch,
    onBurn,
    onUndo
}: DrumControlProps) => {

    // Capitalize label
    const label = drumType === 'left' ? 'Left Drum' : 'Right Drum';

    // Color configurations depending on drum type
    const colors = drumType === 'left'
        ? {
            gradient: 'linear-gradient(145deg, #3b82f6, #2563eb)',
            shadow: 'rgba(37, 99, 235, 0.4)',
            hoverShadow: 'rgba(37, 99, 235, 0.6)'
        }
        : {
            gradient: 'linear-gradient(145deg, #10b981, #059669)',
            shadow: 'rgba(16, 185, 129, 0.4)',
            hoverShadow: 'rgba(16, 185, 129, 0.6)'
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
                        background: colors.gradient,
                        boxShadow: `0 8px 24px ${colors.shadow}`,
                        '&:hover': {
                            boxShadow: `0 12px 32px ${colors.hoverShadow}`,
                            transform: 'translateY(-4px) scale(1.02)'
                        },
                        py: 3.5,
                        px: 2,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    label={
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{label}</Typography>
                            <Chip
                                label={`${launches} launches`}
                                size="small"
                                sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'white', border: 'none', px: 1.5, py: 0.5, height: 'auto', fontSize: '14px', fontWeight: 500, borderRadius: '12px' }}
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
                        border: '1.5px solid rgba(239, 68, 68, 0.5)',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        color: '#f87171',
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            borderColor: '#ef4444',
                            color: '#ef4444',
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
                sx={{
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '2px solid #3b82f6',
                    color: '#f8fafc',
                    textTransform: 'none',
                    borderRadius: '16px',
                    py: 1.5,
                    px: 2,
                    fontSize: '15px',
                    fontWeight: 600,
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.2s ease',
                    mt: 1,
                    '&:hover': {
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.5)',
                        borderColor: 'transparent'
                    },
                    '&:disabled': {
                        opacity: 0.5,
                        color: 'rgba(255, 255, 255, 0.3)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    }
                }}
            >
                − Undo {drumType === 'left' ? 'Left' : 'Right'}
            </Button>

            <Typography sx={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px', mt: 1, fontFamily: 'monospace', fontWeight: 500 }}>
                {launches === 0 ? 'Not yet launched' : `${launches} recorded`}
            </Typography>
        </Stack>
    );
};