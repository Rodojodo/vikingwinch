import { Box, Stack, Typography, Chip, Button } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { LaunchButton } from '../components/LaunchButton';
import { TraineeAssignmentPanel } from '../components/TraineeAssignmentPanel';
import { RemarksRepairsPanel } from '../components/RemarksRepairsPanel';
import { WinchDetailsSticker } from '../components/WinchDetailsSticker';
import { useWinchSession } from '../hooks/useWinchSession';
import './LaunchPanel.css';

const ANIMATIONS = [
    'animFadeScale 0.6s cubic-bezier(0.2, 0, 0, 1) forwards', // M3 Emphasized
    'animSlideUp 0.6s cubic-bezier(0.2, 0, 0, 1) forwards',
    'animPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    'animFlip 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    'animWobble 0.6s ease-out forwards',
    'animSpinIn 0.6s ease-out forwards',
    'animElastic 0.8s ease forwards',
    'animTada 0.8s ease forwards',
    'animJello 0.8s ease forwards',
    'animDropBounce 0.7s ease-out forwards',
    'animRollIn 0.6s ease-out forwards',
    'animHeartbeat 0.7s ease forwards'
];

export const LaunchPanel = () => {
    const { derived, isLoading, executeLaunch, undoLaunch, changeTrainee, addRemark, state } = useWinchSession();
    
    const { leftLaunches, rightLaunches, leftLast, rightLast } = derived;

    const [isRecentLaunch, setIsRecentLaunch] = useState(false);

    useEffect(() => {
        const checkRecent = () => {
            let latestTime = 0;
            if (leftLast) latestTime = Math.max(latestTime, new Date(leftLast).getTime());
            if (rightLast) latestTime = Math.max(latestTime, new Date(rightLast).getTime());
            
            if (latestTime > 0) {
                const diff = Date.now() - latestTime;
                setIsRecentLaunch(diff < 2.5 * 60 * 1000);
            } else {
                setIsRecentLaunch(false);
            }
        };

        checkRecent();
        const interval = setInterval(checkRecent, 1000);
        return () => clearInterval(interval);
    }, [leftLast, rightLast]);

    const [isResetting, setIsResetting] = useState(false);
    const [currentAnim, setCurrentAnim] = useState('none');
    
    const prevLaunchesRef = useRef({ left: leftLaunches, right: rightLaunches });
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const prev = prevLaunchesRef.current;
        const leftChanged = leftLaunches !== prev.left;
        const rightChanged = rightLaunches !== prev.right;

        if (leftChanged || rightChanged) {
            // If they just became equal via a new launch (increase), trigger reset animation
            if (leftLaunches === rightLaunches && (leftLaunches > prev.left || rightLaunches > prev.right)) {
                setIsResetting(true);
                
                const timer1 = setTimeout(() => {
                    const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
                    setCurrentAnim(randomAnim);
                    setIsResetting(false);
                    
                    const timer2 = setTimeout(() => {
                        setCurrentAnim('none');
                    }, 700);
                    timersRef.current.push(timer2);
                }, 400); 
                timersRef.current.push(timer1);
            }
        }
        
        prevLaunchesRef.current = { left: leftLaunches, right: rightLaunches };
    }, [leftLaunches, rightLaunches]);

    useEffect(() => {
        return () => {
            timersRef.current.forEach(clearTimeout);
        };
    }, []);

    const isActuallyEqual = leftLaunches === rightLaunches;
    const leftUsed = (leftLaunches > rightLaunches) || (isActuallyEqual && isResetting);
    const rightUsed = (rightLaunches > leftLaunches) || (isActuallyEqual && isResetting);

    const handleLaunchLeft = () => executeLaunch('left').catch(console.error);
    const handleLaunchRight = () => executeLaunch('right').catch(console.error);
    
    const handleUndoLeft = () => undoLaunch('left').catch(console.error);
    const handleUndoRight = () => undoLaunch('right').catch(console.error);

    const handleBurnLeft = () => executeLaunch('left', true).catch(console.error);
    const handleBurnRight = () => executeLaunch('right', true).catch(console.error);

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
                
                <WinchDetailsSticker 
                    isRecentLaunch={isRecentLaunch} 
                    squadron={state.squadron}
                    winchId={state.winchId}
                />
            </Box>

            <Stack direction="row" spacing={3} sx={{ width: '100%', justifyContent: 'center' }}>
                {/* Left Drum */}
                <Stack spacing={1} sx={{ flex: 1 }}>
                    <Stack spacing={1} sx={{ 
                        transition: currentAnim !== 'none' ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: isResetting ? 0.3 : (leftUsed ? 0.4 : 1),
                        transform: (isResetting && leftUsed) ? 'scale(0.92)' : (leftUsed ? 'scale(0.96)' : 'scale(1)'),
                        pointerEvents: isResetting ? 'none' : 'auto',
                        animation: currentAnim !== 'none' && !isResetting && !leftUsed ? currentAnim : 'none',
                    }}>
                        <LaunchButton
                            isLoading={isLoading}
                            disabled={isLoading || leftUsed || isResetting}
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
                            disabled={isLoading || leftUsed || isResetting}
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
                    </Stack>

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
                    <Stack spacing={1} sx={{ 
                        transition: currentAnim !== 'none' ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: isResetting ? 0.3 : (rightUsed ? 0.4 : 1),
                        transform: (isResetting && rightUsed) ? 'scale(0.92)' : (rightUsed ? 'scale(0.96)' : 'scale(1)'),
                        pointerEvents: isResetting ? 'none' : 'auto',
                        animation: currentAnim !== 'none' && !isResetting && !rightUsed ? currentAnim : 'none',
                    }}>
                        <LaunchButton
                            isLoading={isLoading}
                            disabled={isLoading || rightUsed || isResetting}
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
                            disabled={isLoading || rightUsed || isResetting}
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
                    </Stack>

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
