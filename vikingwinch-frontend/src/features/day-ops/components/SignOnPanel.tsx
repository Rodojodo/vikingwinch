import React, {useEffect, useState} from 'react';
import {Box, Button, Paper, Typography} from '@mui/material';
import {getOperatorsForSquadron} from '../../winch-ops/api/dataClient.ts';
import type {OperatorRead} from '../../winch-ops/types';
import {useWinchSession} from '../../winch-ops/hooks/useWinchSession.ts';
import {TraineeSelect} from './TraineeSelect.tsx';
import {elevatedPanel, errorBannerSx, glassPanelSx, glowingPrimaryButtonSx} from "../../../themes/styles.ts";
import type {SxProps, Theme} from "@mui/material/styles";

interface SignOnPanelProps {
    session: ReturnType<typeof useWinchSession>;
    onComplete: () => void;
    lastOperatorSn: string | null;
    lastTraineeSn: string | null;
}

export const SignOnPanel: React.FC<SignOnPanelProps> = ({ session, onComplete, lastOperatorSn, lastTraineeSn }) => {
    const { state, recordSignOn, isLoading } = session;
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [selectedTraineeSn, setSelectedTraineeSn] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!state.squadron) return;
        setIsFetching(true);
        const controller = new AbortController();
        getOperatorsForSquadron(state.squadron, controller.signal)
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
    }, [state.squadron]);

    const handleSignOn = async () => {
        setError(null);
        try {
            await recordSignOn(selectedTraineeSn || null);
            onComplete();
        } catch (e) {
            console.error("Sign on failed", e);
            setError("Failed to record sign-on.");
        }
    };

    let currentOperatorText = "None";
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
                Winch {state.winchId}
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
                    }
                ] as SxProps<Theme>}>
                <Typography variant="subtitle2" sx={{mb: 1}}>
                    Add trainee (optional)
                </Typography>
                <TraineeSelect
                    value={selectedTraineeSn}
                    onChange={setSelectedTraineeSn}
                    operators={operators}
                    operatorSn={state.operatorSn}
                    isFetching={isFetching}
                />
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
