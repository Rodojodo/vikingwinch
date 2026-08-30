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
import type {Trainee} from "../types";
import { useWinchSession } from '../hooks/useWinchSession'


const { changeTrainee } = useWinchSession();
const TRAINEES: Trainee[] = [
    {id: '1', name: 'Ben Ten'},
    {id: '2', name: 'Gwen Tennyson'},
];

type TraineeAssignmentPanelProps = {
  isLoading: boolean;
};

export const TraineeAssignmentPanel: React.FC<TraineeAssignmentPanelProps> = ({isLoading}) => {
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
                    maxWidth: 500,
                    height: 64,
                    backgroundColor: '#273044',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    '&:hover': {
                        backgroundColor: '#2c3648',
                    },
                }}
            >
                <Typography sx={{color: '#ffffff', fontWeight: 500, fontSize: '1rem', zIndex: 1}}>
                    + Add trainee
                </Typography>
            </ButtonBase>
    )
        ;
    }

    return (
        <Paper
            elevation={3}
            sx={{
                backgroundColor: '#1d2a45', // Target ThemeProvider background.paper
                border: '1px solid #2f3a4e',
                borderRadius: 2,
                p: 2,
                width: 400,
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