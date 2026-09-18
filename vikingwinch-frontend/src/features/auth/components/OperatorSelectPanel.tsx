import {Box, Button, CircularProgress, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';
import {useEffect, useState} from 'react';
import {getOperatorsForSquadron} from '../../../core/http/operatorsClient.ts';
import type {OperatorRead} from '../../../core/types/OperatorRead.ts';
import {darkBlueButton, errorBannerSx, glassPanelSx} from '../../../themes/styles.ts';

export interface OperatorSelectPanelProps {
    squadronId: string;
    onSelectOperator: (operatorSn: string) => void;
}

export const OperatorSelectPanel = ({ squadronId, onSelectOperator }: OperatorSelectPanelProps) => {
    const [operators, setOperators] = useState<OperatorRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [prevSquadronId, setPrevSquadronId] = useState(squadronId);

    if (squadronId !== prevSquadronId) {
        setPrevSquadronId(squadronId);
        setLoading(true);
        setError(null);
    }

    useEffect(() => {
        let isMounted = true;
        const fetchOperators = async () => {
            try {
                const data = await getOperatorsForSquadron(squadronId);
                if (isMounted) {
                    setOperators(data ?? []);
                    setLoading(false);
                }
            } catch {
                if (isMounted) {
                    setError('Failed to load operators');
                    setLoading(false);
                }
            }
        };

        fetchOperators();
        return () => {
            isMounted = false;
        };
    }, [squadronId]);

    return (
        <Box sx={[glassPanelSx, {maxWidth: 540, gap: 3}] as SxProps<Theme>}>
            <Typography variant="h2" sx={{mb: 1}}>
                Select an Operator
            </Typography>

            {loading ? (
                <CircularProgress color="inherit" />
            ) : error ? (
                <Typography color="error" sx={errorBannerSx}>{error}</Typography>
            ) : operators.length === 0 ? (
                <Typography>No operators available for this squadron.</Typography>
            ) : (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%'}}>
                    {operators.map(operator => (
                        <Button
                            key={operator.service_no}
                            variant="outlined"
                            onClick={() => onSelectOperator(operator.service_no)}
                            sx={([
                                darkBlueButton,
                                {
                                    flexGrow: 1,
                                    flexBasis: 'calc(33.333% - 16px)',
                                    py: 2.5,
                                },
                            ] as SxProps<Theme>)}
                        >
                            {operator.name}
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
};
