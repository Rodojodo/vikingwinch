import React from 'react';
import {FormControl, MenuItem, Select, type SelectChangeEvent} from '@mui/material';
import type {OperatorRead} from '../../winch-ops/types';

export interface TraineeSelectProps {
    value: string;
    onChange: (value: string) => void;
    operators: OperatorRead[];
    operatorSn: string | null | undefined;
    disabled?: boolean;
    isFetching?: boolean;
}

export const TraineeSelect: React.FC<TraineeSelectProps> = ({
    value,
    onChange,
    operators,
    operatorSn,
    disabled = false,
    isFetching = false,
}) => {
    return (
        <FormControl fullWidth size="small">
            <Select
                value={value}
                onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
                displayEmpty
                disabled={disabled || isFetching}
                sx={{
                    backgroundColor: '#111927',
                    color: 'white',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
            >
                <MenuItem value="">— None —</MenuItem>
                {operators
                    .filter(op => op.service_no !== operatorSn)
                    .map(op => (
                        <MenuItem key={op.service_no} value={op.service_no}>
                            {op.name}
                        </MenuItem>
                    ))
                }
            </Select>
        </FormControl>
    );
};
