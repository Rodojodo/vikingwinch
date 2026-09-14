import {Box, Button, Typography} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {getTabButtonStyles, glassPanelSx, skylogCardStyle, skylogTotalCardStyle} from '../../../themes/styles.ts';
import type {SxProps, Theme} from "@mui/material/styles";

interface SkylogValuesProps {
    onBack: () => void;
    winchId: number | null;
    squadron: string;
    leftLaunches: number;
    rightLaunches: number;
}

export const SkylogValues = ({ onBack, winchId, squadron, leftLaunches, rightLaunches }: SkylogValuesProps) => {
    const winchTotal = leftLaunches + rightLaunches;

    return (
        <Box sx={[glassPanelSx, {maxWidth: 540, gap: 3}] as SxProps<Theme>}>
            <Box sx={{ position: 'absolute', top: 32, left: 32 }}>
                <Button 
                    variant="outlined" 
                    onClick={onBack}
                    startIcon={<ArrowBackIcon sx={{ fontSize: '18px !important' }} />}
                    sx={getTabButtonStyles(false)}
                >
                    Back
                </Button>
            </Box>

            <Box sx={{ textAlign: 'center', width: '100%', mt: 1 }}>
                <Typography variant="h3" sx={{mb: 1}}>
                    Skylog Values
                </Typography>

                <Typography variant="subtitle2" sx={{mb: 1}}>
                    {`Winch ${winchId} — ${squadron}`}
                </Typography>
            </Box>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Left Drum */}
                <Box sx={skylogCardStyle}>
                    <Typography variant="subtitle1">
                        Left Drum Total
                    </Typography>
                    <Typography variant="h6">
                        {leftLaunches}
                    </Typography>
                </Box>

                {/* Right Drum */}
                <Box sx={skylogCardStyle}>
                    <Typography variant="subtitle1">
                        Right Drum Total
                    </Typography>
                    <Typography variant="h6">
                        {rightLaunches}
                    </Typography>
                </Box>

                {/* Winch Total */}
                <Box sx={skylogTotalCardStyle}>
                    <Typography variant="subtitle1" sx={{color: 'primary.light'}}>
                        Winch Total (L + R)
                    </Typography>
                    <Typography variant="h6">
                        {winchTotal}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default SkylogValues;
