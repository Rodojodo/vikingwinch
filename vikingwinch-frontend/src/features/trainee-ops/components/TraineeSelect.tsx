import React from 'react';
import {FormControl, MenuItem, Select, type SelectChangeEvent} from '@mui/material';
import type {OperatorRead} from '../../auth/types/authTypes';
import {darkMenuStyles, darkSelectStyles} from "../../../themes/styles.ts";

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
                    ))
                }
            </Select>
        </FormControl>
    );
};
