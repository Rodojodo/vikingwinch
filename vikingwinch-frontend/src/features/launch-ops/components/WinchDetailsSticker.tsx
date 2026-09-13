import {Box, Typography} from '@mui/material';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

interface WinchDetailsStickerProps {
    isRecentLaunch: boolean;
    squadron: string;
    winchId: number | null;
}

export const WinchDetailsSticker = ({ isRecentLaunch, squadron, winchId }: WinchDetailsStickerProps) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            {isRecentLaunch ? (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px', borderRadius: '20px',
                    backgroundColor: 'error.dark',
                    color: 'error.main',
                    fontWeight: 700, fontSize: '13px',
                    lineHeight: 1
                }}>
                    <LocalFireDepartmentIcon sx={{ fontSize: '16px' }} />
                    <span>Don't turn off winch</span>
                </Box>
            ) : (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px', borderRadius: '20px',
                    backgroundColor: 'success.dark',
                    color: 'success.main',
                    fontWeight: 700, fontSize: '13px',
                    lineHeight: 1
                }}>
                    <EnergySavingsLeafIcon sx={{ fontSize: '16px' }} />
                    <span>Turn off winch</span>
                </Box>
            )}
            <Typography variant="subtitle2" sx={{fontSize: '16px'}}>
                {`Winch ${winchId} — ${squadron}`}
            </Typography>
        </Box>
    );
};
