import {Box, Stack, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import {getSlidingPillBackgroundSx, slidingPillSx, toggleContainerSx} from "../../../themes/styles.ts";

interface Props {
    operatorSn: string;
    operatorName: string;
    traineeSn: string | null;
    traineeName?: string;
    value: string;
    onChange: (sn: string) => void;
}

export const ActiveDriverToggle: React.FC<Props> = ({
                                                        operatorSn,
                                                        operatorName,
                                                        traineeSn,
                                                        traineeName,
                                                        value,
                                                        onChange
                                                    }) => {
    if (!traineeSn) return null;

    const isTraineeActive = value === traineeSn;

    return (
        <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{textAlign: 'center'}}>
                Active driver
            </Typography>
            <Box sx={toggleContainerSx}>
                <Box sx={getSlidingPillBackgroundSx(isTraineeActive)}/>
                <ToggleButtonGroup
                    value={value}
                    exclusive
                    fullWidth
                    onChange={(_, next) => next && onChange(next)}
                    sx={slidingPillSx}
                >
                    <ToggleButton value={operatorSn}>{operatorName}</ToggleButton>
                    <ToggleButton value={traineeSn}>{traineeName ?? 'Trainee'}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Stack>
    );
};