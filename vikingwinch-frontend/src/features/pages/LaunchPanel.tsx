import { Box, Stack, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { TraineeAssignmentPanel } from '../components/TraineeAssignmentPanel';
import { RemarksRepairsPanel } from '../components/RemarksRepairsPanel';
import { WinchDetailsSticker } from '../components/WinchDetailsSticker';
import { useWinchSession } from '../hooks/useWinchSession';
import './LaunchPanel.css';
import {DrumControl} from "../components/DrumControl.tsx";

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
                <DrumControl
                    drumType="left"
                    launches={leftLaunches}
                    isLoading={isLoading}
                    isUsed={leftUsed}
                    isResetting={isResetting}
                    currentAnim={currentAnim}
                    onLaunch={handleLaunchLeft}
                    onBurn={handleBurnLeft}
                    onUndo={handleUndoLeft}
                />

                <DrumControl
                    drumType="right"
                    launches={rightLaunches}
                    isLoading={isLoading}
                    isUsed={rightUsed}
                    isResetting={isResetting}
                    currentAnim={currentAnim}
                    onLaunch={handleLaunchRight}
                    onBurn={handleBurnRight}
                    onUndo={handleUndoRight}
                />
            </Stack>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TraineeAssignmentPanel isLoading={isLoading} changeTrainee={changeTrainee} />
                <RemarksRepairsPanel addRemark={addRemark} isLoading={isLoading} derived={derived} state={state} />
            </Box>
        </Box>
    );
};

export default LaunchPanel;
