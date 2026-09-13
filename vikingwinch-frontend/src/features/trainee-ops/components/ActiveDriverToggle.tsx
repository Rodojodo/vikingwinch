import {Box, Stack, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';

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
            <Typography variant="body2" sx={{color: '#8b9bb4', fontWeight: 500, textAlign: 'center'}}>
                Active driver
            </Typography>
            <Box
                sx={{
                    position: 'relative',
                    p: '4px',
                    borderRadius: '14px',
                    backgroundColor: '#151c2d',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '4px',
                        bottom: '4px',
                        left: '4px',
                        width: 'calc(50% - 4px)',
                        borderRadius: '10px',
                        backgroundColor: '#3b82f6',
                        boxShadow: '0 4px 12px rgba(41,112,255,0.35)',
                        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
                        transform: isTraineeActive ? 'translateX(100%)' : 'translateX(0)',
                        zIndex: 0,
                    }}
                />
                <ToggleButtonGroup
                    value={value}
                    exclusive
                    fullWidth
                    onChange={(_, next) => next && onChange(next)}
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        gap: 0,
                        '& .MuiToggleButton-root': {
                            color: '#94a3b8',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '10px !important',
                            fontWeight: 600,
                            textTransform: 'none',
                            py: 1.2,
                            transition: 'color 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'transparent',
                            },
                            '&.Mui-selected': {
                                backgroundColor: 'transparent',
                                color: '#ffffff',
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                },
                            },
                        },
                    }}
                >
                    <ToggleButton value={operatorSn}>{operatorName}</ToggleButton>
                    <ToggleButton value={traineeSn}>{traineeName ?? 'Trainee'}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Stack>
    );
};