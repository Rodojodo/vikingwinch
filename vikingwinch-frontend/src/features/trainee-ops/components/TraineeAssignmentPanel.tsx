import React, {useEffect, useState} from 'react';
import {Box, Button, ButtonBase, Paper, Stack, Typography} from '@mui/material';
import {getOperatorsForSquadron} from '../../auth/api/authClient';
import type {DayLogResponse} from '../../day-ops/types/dayOpsTypes';
import type {OperatorRead} from '../../auth/types/authTypes';
import {TraineeSelect} from './TraineeSelect.tsx';
import {elevatedPanel, getTabButtonStyles, glowingPrimaryButtonSx} from "../../../themes/styles.ts";

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
                sx={getTabButtonStyles(false)}
            >
                    {labelText}
            </ButtonBase>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={elevatedPanel}
            aria-expanded={true}
        >
            <Box sx={{mb: 2}}>
                <Typography
                    variant="subtitle2"
                    sx={{mb: 1}}
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
                    color="primary"
                    fullWidth
                    disabled={isLoading}
                    onClick={handleConfirm}
                    sx={glowingPrimaryButtonSx}
                >
                    Confirm
                </Button>
                <Button
                    disabled={isLoading}
                    variant="outlined"
                    fullWidth
                    onClick={() => setIsExpanded(false)}
                    sx={getTabButtonStyles(false)}
                >
                    Cancel
                </Button>
            </Stack>
        </Paper>
    );
};