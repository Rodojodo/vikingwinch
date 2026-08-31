import React, {useState} from 'react';
import {
    Box,
    Button, ButtonBase,
    FormControl,
    MenuItem,
    Paper,
    Select,
    type SelectChangeEvent,
    Stack,
    Typography
} from '@mui/material';
import type {DayLogResponse, Trainee} from "../types";


const TRAINEES: Trainee[] = [
    {id: '1', name: 'Ben Ten'},
    {id: '2', name: 'Gwen Tennyson'},
];

type TraineeAssignmentPanelProps = {
  isLoading: boolean;
  changeTrainee: (traineeSn: string) => Promise<DayLogResponse>;
};

export const TraineeAssignmentPanel: React.FC<TraineeAssignmentPanelProps> = ({isLoading, changeTrainee}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [focusedTraineeId, setFocusedTraineeId] = useState<string>('1');

    const handleFocusChange = (event: SelectChangeEvent<string>) => {
        setFocusedTraineeId(event.target.value);
    };


    if (!isExpanded) {
        return (
            <ButtonBase
                onClick={() => setIsExpanded(true)}
                sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: 56,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        transform: 'translateY(-2px)'
                    },
                }}
            >
                <Typography sx={{fontWeight: 600, fontSize: '16px', zIndex: 1}}>
                    + Add trainee
                </Typography>
            </ButtonBase>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '14px',
                p: 2,
                width: '100%',
                boxSizing: 'border-box'
            }}
            aria-expanded={true}
        >
            <Box sx={{mb: 2}}>
                <Typography
                    variant="body2"
                    sx={{color: '#8b9bb4', mb: 1, fontWeight: 500}}
                >
                    Select trainee
                </Typography>
                <FormControl fullWidth size="small">
                    <Select
                        value={focusedTraineeId}
                        onChange={handleFocusChange}
                        sx={{
                            backgroundColor: '#111927',
                            color: 'white',
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2970ff',
                                borderWidth: 2,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2970ff',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2970ff',
                            },
                            '& .MuiSvgIcon-root': {
                                color: '#8b9bb4',
                            }
                        }}
                    >
                        {TRAINEES.map((trainee) => (
                            <MenuItem key={trainee.id} value={trainee.id}>
                                {trainee.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Stack direction="row" spacing={2}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => changeTrainee(focusedTraineeId)}
                    sx={{
                        backgroundColor: '#2970ff',
                        textTransform: 'none',
                        borderRadius: 2,
                        boxShadow: '0px 4px 12px rgba(41, 112, 255, 0.4)',
                        '&:hover': {
                            backgroundColor: '#1a5ce6',
                        }
                    }}
                >
                    Confirm
                </Button>
                <Button
                    disabled={isLoading}
                    variant="outlined"
                    fullWidth
                    onClick={() => setIsExpanded(false)}
                    sx={{
                        borderColor: '#2f3a4e',
                        color: 'white',
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': {
                            borderColor: '#8b9bb4',
                            backgroundColor: 'transparent'
                        }
                    }}
                >
                    Cancel
                </Button>
            </Stack>
        </Paper>
    );
};