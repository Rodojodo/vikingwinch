import {Box, Typography} from '@mui/material';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {statusPillSx, winchDetailsStickerSx, winchDetailsTitleSx} from "../../../themes/styles.ts";

interface WinchDetailsStickerProps {
    isRecentLaunch: boolean;
    squadron: string;
    winchId: number | null;
}

export const WinchDetailsSticker = ({ isRecentLaunch, squadron, winchId }: WinchDetailsStickerProps) => {
    return (
        <Box sx={winchDetailsStickerSx}>
            {isRecentLaunch ? (
                <Box sx={statusPillSx('error')}>
                    <LocalFireDepartmentIcon sx={{fontSize: '20px'}}/>
                    <span>Don't turn off winch</span>
                </Box>
            ) : (
                <Box sx={statusPillSx('success')}>
                    <EnergySavingsLeafIcon sx={{fontSize: '20px'}}/>
                    <span>Turn off winch</span>
                </Box>
            )}

            <Typography variant="h4" sx={winchDetailsTitleSx}>
                <span>{squadron}: </span>
                <span>Winch {winchId}</span>
            </Typography>
        </Box>
    );
};
