import React, {useEffect, useState} from 'react';
import {Box, Button, ButtonBase, Paper, Stack, Typography} from '@mui/material';
import {getOperatorsForSquadron} from '../../winch-ops/api/dataClient.ts';
import type {DayLogResponse, OperatorRead} from '../../winch-ops/types';
import {TraineeSelect} from './TraineeSelect.tsx';

type TraineeAssignmentPanelProps = {
  isLoading: boolean;
    recordSignOn: (traineeSn: string | null) => Promise<DayLogResponse>;
  squadron?: string;
  operatorSn?: string | null;
  traineeSn?: string | null;
};

export const TraineeAssignmentPanel: React.FC<TraineeAssignmentPanelProps> = ({isLoading, recordSignOn, squadron, operatorSn, traineeSn}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [focusedTraineeId, setFocusedTraineeId] = useState<string>('');
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!squadron) return;
        setIsFetching(true);
        const controller = new AbortController();
        getOperatorsForSquadron(squadron, controller.signal)
            .then(data => {
                if (!controller.signal.aborted) {
                    setOperators(data);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsFetching(false);
                }
            });
        return () => controller.abort();
    }, [squadron]);

    const handleConfirm = () => {
        const traineeValue = focusedTraineeId === '' ? null : focusedTraineeId;
        recordSignOn(traineeValue)
            .then(() => {
                setIsExpanded(false);
                setFocusedTraineeId('');
            })
            .catch(console.error);
    };


    const selectedTrainee = traineeSn !== null
        ? operators.find(op => op.service_no === traineeSn)
        : null;

    const labelText = selectedTrainee
        ? `Change trainee (${selectedTrainee.name})`
        : '+ Add trainee';


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
                    {labelText}
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
                <TraineeSelect
                    value={focusedTraineeId}
                    onChange={setFocusedTraineeId}
                    operators={operators}
                    operatorSn={operatorSn}
                    isFetching={isFetching}
                />
            </Box>

            <Stack direction="row" spacing={2}>
                <Button
                    variant="contained"
                    fullWidth
                    disabled={isLoading}
                    onClick={handleConfirm}
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
