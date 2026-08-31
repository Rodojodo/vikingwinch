import { Box, Typography } from '@mui/material';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';

interface WinchDetailsStickerProps {
    isRecentLaunch: boolean;
    squadron: string;
    winchId: number;
}

export const WinchDetailsSticker = ({ isRecentLaunch, squadron, winchId }: WinchDetailsStickerProps) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            {isRecentLaunch ? (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px', borderRadius: '20px',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    fontWeight: 700, fontSize: '13px',
                    lineHeight: 1
                }}>
                    <span style={{ fontSize: '16px' }}>🔥</span>
                    <span>Don't turn off winch</span>
                </Box>
            ) : (
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
            )}
            <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '16px', fontWeight: 500 }}>
                {`Winch ${winchId} — ${squadron}`}
            </Typography>
        </Box>
    );
};
