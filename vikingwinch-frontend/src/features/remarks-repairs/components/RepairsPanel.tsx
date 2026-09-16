import React, {useEffect, useState} from 'react';
import {Alert, Box, Button, FormControl, Grid, MenuItem, Select, TextField, Typography} from '@mui/material';
import {DrumToggleGroup} from './DrumToggleGroup';
import {darkMenuStyles, darkSelectStyles, darkTextFieldStyles} from '../../../themes/styles.ts';
import type {DrumPosition, OperatorRead} from '../../../core/types';
import type {DrumLaunchStatus} from '../types';
import {getOperatorsForSquadron} from '../../../core/http/operatorsClient.ts';

type RepairsPanelProps = {
    addRemark: (remark: string | null, drum: DrumPosition) => Promise<void>;
    isLoading: boolean;
    derived: DrumLaunchStatus;
    squadronId: string;
};

export const RepairsPanel: React.FC<RepairsPanelProps> = ({ addRemark, isLoading, derived, squadronId }) => {
    const [repair, setRepair] = useState<string>('');
    const [drum, setDrum] = useState<DrumPosition>('left');

    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [worker, setWorker] = useState<string>('');
    const [supervisor, setSupervisor] = useState<string>('');

    const [localError, setLocalError] = useState<string | null>(null);
    const [isFetchingOperators, setIsFetchingOperators] = useState(Boolean(squadronId));

    const [prevSquadronId, setPrevSquadronId] = useState(squadronId);
    if (squadronId !== prevSquadronId) {
        setPrevSquadronId(squadronId);
        if (squadronId) {
            setIsFetchingOperators(true);
            setLocalError(null);
        }
    }

    const targetRecord = drum === 'left' ? derived.leftLastRecord : derived.rightLastRecord;
    const hasLaunches = !!targetRecord;

    useEffect(() => {
        if (!squadronId) return;

        const controller = new AbortController();

        getOperatorsForSquadron(squadronId, controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) {
                    setOperators(data);
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setLocalError('Failed to load operators');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsFetchingOperators(false);
                }
            });

        return () => controller.abort();
    }, [squadronId]);

    const handleSubmit = async () => {
        if (!repair.trim() || !hasLaunches || !worker || !supervisor) return;

        const remarkText = `Repair: ${repair} | Worker: ${worker} | Sup: ${supervisor}`;

        setLocalError(null);
        try {
            await addRemark(remarkText, drum);
            setRepair('');
            setWorker('');
            setSupervisor('');
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Failed to submit repair');
        }
    };

    const isSubmitDisabled = isLoading || !repair.trim() || !hasLaunches || !worker || !supervisor || worker === supervisor;

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{mb: 1}}>
                Repair details
            </Typography>
            {localError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {localError}
                </Alert>
            )}
            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the repair carried out..."
                value={repair}
                onChange={(e) => setRepair(e.target.value)}
                sx={darkTextFieldStyles}
            />

            <Grid container spacing={2} sx={{mt: 2}}>
                <Grid size={6}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>Work c/o by (worker)</Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            displayEmpty
                            value={worker ?? ''}
                            onChange={(e) => setWorker(e.target.value as string)}
                            sx={darkSelectStyles}
                            MenuProps={darkMenuStyles}
                            disabled={isFetchingOperators}
                        >
                            <MenuItem value="" disabled>
                                {isFetchingOperators ? 'Loading...' : 'Select worker...'}
                            </MenuItem>
                            {operators.map(op => (
                                <MenuItem
                                    key={op.service_no}
                                    value={op.service_no}
                                    disabled={supervisor !== '' && op.service_no === supervisor}
                                >
                                    {op.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={6}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>Supervised by</Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            displayEmpty
                            value={supervisor ?? ''}
                            onChange={(e) => setSupervisor(e.target.value as string)}
                            sx={darkSelectStyles}
                            MenuProps={darkMenuStyles}
                            disabled={isFetchingOperators}
                        >
                            <MenuItem value="" disabled>
                                {isFetchingOperators ? 'Loading...' : 'Select supervisor...'}
                            </MenuItem>
                            {operators.map(op => (
                                <MenuItem
                                    key={op.service_no}
                                    value={op.service_no}
                                    disabled={worker !== '' && op.service_no === worker}
                                >
                                    {op.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mt: 3}}>
                <Box sx={{flex: 1}}>
                    <DrumToggleGroup value={drum} onChange={setDrum}/>
                </Box>

                {!hasLaunches && (
                    <Typography variant="subtitle2">
                        No launches yet
                    </Typography>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    variant="contained"
                    color="primary"
                    sx={{textTransform: 'none', borderRadius: 2}}
                >
                    {isLoading ? 'Submitting...' : 'Sign as Supervisor'}
                </Button>
            </Box>
        </Box>
    );
};
