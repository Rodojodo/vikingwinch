import {Stack, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';

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

    return (
        <Stack spacing={1}>
            <Typography variant="body2" sx={{color: '#8b9bb4', fontWeight: 500}}>
                Active driver
            </Typography>
            <ToggleButtonGroup
                value={value}
                exclusive
                fullWidth
                onChange={(_, next) => next && onChange(next)}
                sx={{
                    '& .MuiToggleButton-root': {
                        color: '#f8fafc',
                        borderColor: 'rgba(255,255,255,0.1)',
                        '&.Mui-selected': {backgroundColor: '#2970ff', color: 'white'},
                    },
                }}
            >
                <ToggleButton value={operatorSn}>{operatorName}</ToggleButton>
                <ToggleButton value={traineeSn}>{traineeName ?? 'Trainee'}</ToggleButton>
            </ToggleButtonGroup>
        </Stack>
    );
};