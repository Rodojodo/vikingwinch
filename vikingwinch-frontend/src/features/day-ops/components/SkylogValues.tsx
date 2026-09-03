import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { skylogCardStyle, skylogTotalCardStyle } from '../../../themes/styles.ts';

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
        <Box sx={{ 
            p: 5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 4,
            backgroundColor: 'rgba(30, 41, 59, 0.7)', 
            backdropFilter: 'blur(20px)',
            borderRadius: '24px', 
            color: 'white', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: 540,
            position: 'relative'
        }}>
            <Box sx={{ position: 'absolute', top: 32, left: 32 }}>
                <Button 
                    variant="outlined" 
                    onClick={onBack}
                    startIcon={<ArrowBackIcon sx={{ fontSize: '18px !important' }} />}
                    sx={{ 
                        color: '#e2e8f0', 
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        textTransform: 'none',
                        borderRadius: '8px',
                        py: 0.5,
                        px: 1.5,
                        fontWeight: 500,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                    }}
                >
                    Back
                </Button>
            </Box>

            <Box sx={{ textAlign: 'center', width: '100%', mt: 1 }}>
                <Typography variant="h2" sx={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
                    Skylog Values
                </Typography>
                
                <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '16px', fontWeight: 500 }}>
                    {`Winch ${winchId} — ${squadron}`}
                </Typography>
            </Box>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Left Drum */}
                <Box sx={skylogCardStyle}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#94a3b8' }}>
                        Left Drum Total
                    </Typography>
                    <Typography sx={{ 
                        fontSize: '32px', 
                        fontWeight: 700, 
                        fontFamily: 'var(--mono), Consolas, monospace',
                        fontVariantNumeric: 'slashed-zero',
                        color: 'white',
                        lineHeight: 1
                    }}>
                        {leftLaunches}
                    </Typography>
                </Box>

                {/* Right Drum */}
                <Box sx={skylogCardStyle}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#94a3b8' }}>
                        Right Drum Total
                    </Typography>
                    <Typography sx={{ 
                        fontSize: '32px', 
                        fontWeight: 700, 
                        fontFamily: 'var(--mono), Consolas, monospace',
                        fontVariantNumeric: 'slashed-zero',
                        color: 'white',
                        lineHeight: 1
                    }}>
                        {rightLaunches}
                    </Typography>
                </Box>

                {/* Winch Total */}
                <Box sx={skylogTotalCardStyle}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#60a5fa' }}>
                        Winch Total (L + R)
                    </Typography>
                    <Typography sx={{ 
                        fontSize: '32px', 
                        fontWeight: 700, 
                        fontFamily: 'var(--mono), Consolas, monospace',
                        fontVariantNumeric: 'slashed-zero',
                        color: 'white',
                        lineHeight: 1
                    }}>
                        {winchTotal}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default SkylogValues;
