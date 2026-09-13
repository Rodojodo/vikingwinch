import {Box, ButtonBase, Divider, Stack, Typography} from '@mui/material';
import {useEffect, useRef, useState} from 'react';
import {RemarksRepairsPanel} from '../../remarks-repairs/components/RemarksRepairsPanel.tsx';
import {FinishDayPanel} from '../../day-ops/components/FinishDayPanel.tsx';
import {WinchDetailsSticker} from './WinchDetailsSticker.tsx';
import {useWinchSession} from '../../winch-ops/hooks/useWinchSession.ts';
import './LaunchPanel.css';
import {DrumControl} from "./DrumControl.tsx";
import {getTabButtonStyles, glassPanelSx} from "../../../themes/styles.ts";
import type {SxProps, Theme} from "@mui/material/styles";

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

const POST_LAUNCH_COOLDOWN_THRESHOLD_MS = 2.5 * 60 * 1000; // 2.5 minutes

interface LaunchPanelProps {
    onViewSkylogValues?: () => void;
    session: ReturnType<typeof useWinchSession>;
}

export const LaunchPanel = ({ onViewSkylogValues, session }: LaunchPanelProps) => {
    const {derived, isLoading, error, executeLaunch, undoLaunch, addRemark, state} = session;
    
    const { leftTotal, rightTotal, leftLaunches, rightLaunches, leftLast, rightLast } = derived;

    const [isRecentLaunch, setIsRecentLaunch] = useState(false);

    useEffect(() => {
        const checkRecent = () => {
            let latestTime = 0;
            if (leftLast) latestTime = Math.max(latestTime, new Date(leftLast).getTime());
            if (rightLast) latestTime = Math.max(latestTime, new Date(rightLast).getTime());
            
            if (latestTime > 0) {
                const diff = Date.now() - latestTime;
                setIsRecentLaunch(diff < POST_LAUNCH_COOLDOWN_THRESHOLD_MS);
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
    
    const prevLaunchesRef = useRef({ left: leftTotal, right: rightTotal });
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const prev = prevLaunchesRef.current;
        const leftChanged = leftTotal !== prev.left;
        const rightChanged = rightTotal !== prev.right;

        if (leftChanged || rightChanged) {
            // If they just became equal via a new launch (increase), trigger reset animation
            if (leftTotal === rightTotal && (leftTotal > prev.left || rightTotal > prev.right)) {
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
        
        prevLaunchesRef.current = { left: leftTotal, right: rightTotal };
    }, [leftTotal, rightTotal]);

    useEffect(() => {
        return () => {
            timersRef.current.forEach(clearTimeout);
        };
    }, []);

    const isActuallyEqual = leftTotal === rightTotal;
    const leftUsed = (leftTotal > rightTotal) || (isActuallyEqual && isResetting);
    const rightUsed = (rightTotal > leftTotal) || (isActuallyEqual && isResetting);

    const handleLaunchLeft = () => executeLaunch('left').catch(console.error);
    const handleLaunchRight = () => executeLaunch('right').catch(console.error);
    
    const handleUndoLeft = () => undoLaunch('left').catch(console.error);
    const handleUndoRight = () => undoLaunch('right').catch(console.error);

    const handleBurnLeft = () => executeLaunch('left', true).catch(console.error);
    const handleBurnRight = () => executeLaunch('right', true).catch(console.error);

    return (
        <Box sx={[glassPanelSx, {maxWidth: 540, gap: 3}] as SxProps<Theme>}>
            <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="h2" sx={{mb: 1}}>
                    Launch Panel
                </Typography>
                
                <WinchDetailsSticker 
                    isRecentLaunch={isRecentLaunch} 
                    squadron={state.squadron}
                    winchId={state.winchId}
                />
            </Box>

            {error && (
                <Typography color="error" variant="body2" sx={{ textAlign: 'center', mb: 2 }}>
                    {error}
                </Typography>
            )}
            
            <Stack direction="row" spacing={3} sx={{ width: '100%', justifyContent: 'center' }}>
                <DrumControl
                    drumType="left"
                    launches={leftLaunches}
                    lastLaunch={leftLast}
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
                    lastLaunch={rightLast}
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
                <Divider sx={{borderColor: 'border.main', my: 0.5}}/>
                <RemarksRepairsPanel addRemark={addRemark} isLoading={isLoading} derived={derived} state={state} />
                <Divider sx={{borderColor: 'border.main', my: 0.5}}/>

                <ButtonBase
                    onClick={onViewSkylogValues}
                    sx={getTabButtonStyles(false)}
                >
                    <Typography sx={{fontWeight: 600, fontSize: '16px', zIndex: 1}}>
                        Show skylog values
                    </Typography>
                </ButtonBase>
                <FinishDayPanel finishDay={session.finishDay} isLoading={isLoading} state={state} />
            </Box>
        </Box>
    );
};

export default LaunchPanel;
