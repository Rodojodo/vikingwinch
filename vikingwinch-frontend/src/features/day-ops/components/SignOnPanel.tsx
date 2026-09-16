import React, {useEffect, useState} from 'react';
import {Box, Button, FormControl, MenuItem, Paper, Select, Typography} from '@mui/material';
import {getOperatorsForSquadron} from '../../../core/http/operatorsClient.ts';
import type {OperatorRead} from '../../../core/types';
import {useSessionIdentity} from '../../../app/hooks/useSessionIdentity.ts';
import {postDayLogToDb} from '../api/dayOpsClient.ts';
import {
    darkMenuStyles,
    darkSelectStyles,
    elevatedPanel,
    errorBannerSx,
    glassPanelSx,
    glowingPrimaryButtonSx
} from '../../../themes/styles.ts';
import type {SxProps, Theme} from '@mui/material/styles';

interface SignOnPanelProps {
    onComplete: () => void;
    lastOperatorSn: string | null;
    lastTraineeSn: string | null;
    onSetTrainee?: (traineeSn: string | null) => void;
}

export const SignOnPanel: React.FC<SignOnPanelProps> = ({
                                                            onComplete,
                                                            lastOperatorSn,
                                                            lastTraineeSn,
                                                            onSetTrainee,
                                                        }) => {
    const {squadronId, winchId, operatorSn} = useSessionIdentity();
    const [isLoading, setIsLoading] = useState(false);
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [selectedTraineeSn, setSelectedTraineeSn] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(Boolean(squadronId));
    const [prevSquadronId, setPrevSquadronId] = useState(squadronId);

    if (squadronId !== prevSquadronId) {
        setPrevSquadronId(squadronId);
        if (squadronId) {
            setIsFetching(true);
        }
    }

    useEffect(() => {
        if (!squadronId) return;
        const controller = new AbortController();
        getOperatorsForSquadron(squadronId, controller.signal)
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
    }, [squadronId]);

    const handleSignOn = async () => {
        if (!winchId) return;
        setIsLoading(true);
        setError(null);
        try {
            await postDayLogToDb({
                squadron_id: squadronId,
                winch_id: winchId,
                operator_sn: operatorSn,
                trainee: selectedTraineeSn || null,
                type: 'sign_on',
                cable_check: null,
                hours: null,
            }, winchId);
            if (onSetTrainee) {
                onSetTrainee(selectedTraineeSn || null);
            }
            onComplete();
        } catch (e) {
            console.error('Sign on failed', e);
            setError('Failed to record sign-on.');
        } finally {
            setIsLoading(false);
        }
    };

    let currentOperatorText = 'None';
    if (lastOperatorSn) {
        const lastOperatorObj = operators.find(o => o.service_no === lastOperatorSn);
        currentOperatorText = lastOperatorObj ? lastOperatorObj.name : lastOperatorSn;
        if (lastTraineeSn) {
            const lastTraineeObj = operators.find(o => o.service_no === lastTraineeSn);
            currentOperatorText += ` & ${lastTraineeObj ? lastTraineeObj.name : lastTraineeSn}`;
        }
    }

    return (
        <Box sx={[glassPanelSx, {maxWidth: 540, gap: 2}] as SxProps<Theme>}>
            {error && (
                <Typography variant="body2" sx={errorBannerSx}>
                    {error}
                </Typography>
            )}
            <Typography variant="h2">
                Winch {winchId}
            </Typography>

            <Typography variant="subtitle2" sx={{mb: 1}}>
                Current operator: {currentOperatorText}
            </Typography>

            <Typography variant="subtitle1">
                This winch has already been inspected today.
            </Typography>

            <Paper
                elevation={0}
                sx={[
                    elevatedPanel,
                    {
                        mb: 1,
                        width: '100%',
                    },
                ] as SxProps<Theme>}
            >
                <Typography variant="subtitle2" sx={{mb: 1}}>
                    Add trainee (optional)
                </Typography>
                <FormControl fullWidth size="small">
                    <Select
                        value={selectedTraineeSn}
                        onChange={(e) => setSelectedTraineeSn(e.target.value)}
                        displayEmpty
                        disabled={isLoading || isFetching}
                        sx={darkSelectStyles}
                        MenuProps={darkMenuStyles}
                    >
                        <MenuItem value="">— None —</MenuItem>
                        {operators
                            .filter(op => op.service_no !== operatorSn)
                            .map(op => (
                                <MenuItem key={op.service_no} value={op.service_no}>
                                    {op.name}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>
            </Paper>

            <Button
                variant="contained"
                fullWidth
                disabled={isLoading}
                onClick={handleSignOn}
                sx={glowingPrimaryButtonSx}
            >
                Walkaround complete. Sign on to winch
            </Button>
        </Box>
    );
};
