import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TraineeSelect } from './TraineeSelect.tsx';
import type { OperatorRead } from '../../winch-ops/types';

describe('TraineeSelect', () => {
    const mockOperators: OperatorRead[] = [
        { service_no: 'OFF-1001', name: 'Joe Bloggs', squadron_id: '123 VGS' },
        { service_no: 'OFF-1002', name: 'Sarah Jenkins', squadron_id: '123 VGS' },
        { service_no: 'CDT-3042', name: 'Emily Clack', squadron_id: '123 VGS' }
    ];

    it('renders the component with default Empty option', () => {
        render(
            <TraineeSelect 
                value=""
                onChange={vi.fn()}
                operators={mockOperators}
                operatorSn="OFF-1001"
            />
        );

        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('— None —')).toBeInTheDocument();
    });

    it('filters out the current operator', async () => {
        const user = userEvent.setup();
        render(
            <TraineeSelect 
                value=""
                onChange={vi.fn()}
                operators={mockOperators}
                operatorSn="OFF-1001"
            />
        );

        const select = screen.getByRole('combobox');
        await user.click(select);

        const listbox = screen.getByRole('listbox');
        
        expect(within(listbox).getByRole('option', { name: 'Sarah Jenkins' })).toBeInTheDocument();
        expect(within(listbox).getByRole('option', { name: 'Emily Clack' })).toBeInTheDocument();
        expect(within(listbox).queryByRole('option', { name: 'Joe Bloggs' })).not.toBeInTheDocument();
    });

    it('calls onChange when an option is selected', async () => {
        const onChangeMock = vi.fn();
        const user = userEvent.setup();
        
        render(
            <TraineeSelect 
                value=""
                onChange={onChangeMock}
                operators={mockOperators}
                operatorSn="OFF-1001"
            />
        );

        const select = screen.getByRole('combobox');
        await user.click(select);

        const listbox = screen.getByRole('listbox');
        await user.click(within(listbox).getByRole('option', { name: 'Sarah Jenkins' }));

        expect(onChangeMock).toHaveBeenCalledWith('OFF-1002');
    });

    it('is disabled when disabled prop is true', () => {
        render(
            <TraineeSelect 
                value=""
                onChange={vi.fn()}
                operators={mockOperators}
                operatorSn="OFF-1001"
                disabled={true}
            />
        );

        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAttribute('aria-disabled', 'true');
    });

    it('is disabled when isFetching prop is true', () => {
        render(
            <TraineeSelect 
                value=""
                onChange={vi.fn()}
                operators={mockOperators}
                operatorSn="OFF-1001"
                isFetching={true}
            />
        );

        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAttribute('aria-disabled', 'true');
    });

    it('disables the Empty option when emptyDisabled is true', async () => {
        const user = userEvent.setup();
        render(
            <TraineeSelect 
                value="OFF-1002"
                onChange={vi.fn()}
                operators={mockOperators}
                operatorSn="OFF-1001"
                emptyDisabled={true}
            />
        );

        const select = screen.getByRole('combobox');
        await user.click(select);

        const listbox = screen.getByRole('listbox');
        const emptyOption = within(listbox).getByRole('option', { name: '— None —' });
        
        expect(emptyOption).toHaveAttribute('aria-disabled', 'true');
    });
});
