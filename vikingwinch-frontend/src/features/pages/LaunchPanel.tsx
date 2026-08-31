import { Box, Stack, Typography, Chip, Button } from '@mui/material';
import { LaunchButton } from '../components/LaunchButton';
import { TraineeAssignmentPanel } from '../components/TraineeAssignmentPanel';
import { RemarksRepairsPanel } from '../components/RemarksRepairsPanel';
import { useWinchSession } from '../hooks/useWinchSession';

import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';

export const LaunchPanel = () => {
    const { derived, isLoading, executeLaunch, undoLaunch, changeTrainee, addRemark, state } = useWinchSession();
    
    const { leftLaunches, rightLaunches } = derived;

    const handleLaunchLeft = () => executeLaunch('left');
    const handleLaunchRight = () => executeLaunch('right');
    
    const handleUndoLeft = () => undoLaunch('left');
    const handleUndoRight = () => undoLaunch('right');

    const handleBurnLeft = () => executeLaunch('left', true);
    const handleBurnRight = () => executeLaunch('right', true);

    return (
        <Box sx={{ 
            p: 5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 3,
            backgroundColor: 'rgba(30, 41, 59, 0.7)', 
            backdropFilter: 'blur(20px)',
            borderRadius: '24px', 
            color: 'white', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: 540
        }}>
            <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="h2" sx={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
                    Launch Panel
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '20px',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        color: '#4caf50',
                        fontWeight: 700, fontSize: '13px',
                        lineHeight: 1
                    }}>
                        <EnergySavingsLeafIcon sx={{ fontSize: '16px' }} />
                        <span>Turn off winch</span>
                    </Box>
                    <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '16px', fontWeight: 500 }}>
                        Winch 17 — 661 VGS
                    </Typography>
                </Box>
            </Box>

            <Stack direction="row" spacing={3} sx={{ width: '100%', justifyContent: 'center' }}>
                {/* Left Drum */}
                <Stack spacing={1} sx={{ flex: 1 }}>
                    <LaunchButton
                        isLoading={isLoading}
                        onClick={handleLaunchLeft}
                        sx={{
                            background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                            '&:hover': { 
                                boxShadow: '0 12px 32px rgba(37, 99, 235, 0.6)',
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
                                <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Left Drum</Typography>
                                <Chip label={`${leftLaunches} launches`} size="small" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'white', border: 'none', px: 1.5, py: 0.5, height: 'auto', fontSize: '14px', fontWeight: 500, borderRadius: '12px' }} />
                            </Box>
                        }
                    />
                    
                    <LaunchButton
                        isLoading={isLoading}
                        onClick={handleBurnLeft}
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
                                🔥 Burn Left
                            </Typography>
                        }
                    />

                    <Button
                        variant="outlined"
                        fullWidth
                        disabled={isLoading || leftLaunches === 0}
                        onClick={handleUndoLeft}
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
                        − Undo Left
                    </Button>
                    
                    <Typography sx={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px', mt: 1, fontFamily: 'monospace', fontWeight: 500 }}>
                        {leftLaunches === 0 ? 'Not yet launched' : `${leftLaunches} recorded`}
                    </Typography>
                </Stack>

                {/* Right Drum */}
                <Stack spacing={1} sx={{ flex: 1 }}>
                    <LaunchButton
                        isLoading={isLoading}
                        onClick={handleLaunchRight}
                        sx={{
                            background: 'linear-gradient(145deg, #10b981, #059669)',
                            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                            '&:hover': { 
                                boxShadow: '0 12px 32px rgba(16, 185, 129, 0.6)',
                                transform: 'translateY(-4px) scale(1.02)'
                            },
                            py: 3.5,
                            px: 2,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        label={
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Right Drum</Typography>
                                <Chip label={`${rightLaunches} launches`} size="small" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'white', border: 'none', px: 1.5, py: 0.5, height: 'auto', fontSize: '14px', fontWeight: 500, borderRadius: '12px' }} />
                            </Box>
                        }
                    />
                    
                    <LaunchButton
                        isLoading={isLoading}
                        onClick={handleBurnRight}
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
                                🔥 Burn Right
                            </Typography>
                        }
                    />

                    <Button
                        variant="outlined"
                        fullWidth
                        disabled={isLoading || rightLaunches === 0}
                        onClick={handleUndoRight}
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
                        − Undo Right
                    </Button>
                    
                    <Typography sx={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px', mt: 1, fontFamily: 'monospace', fontWeight: 500 }}>
                        {rightLaunches === 0 ? 'Not yet launched' : `${rightLaunches} recorded`}
                    </Typography>
                </Stack>
            </Stack>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TraineeAssignmentPanel isLoading={isLoading} changeTrainee={changeTrainee} />
                <RemarksRepairsPanel addRemark={addRemark} isLoading={isLoading} derived={derived} state={state} />
            </Box>
        </Box>
    );
};

export default LaunchPanel;
