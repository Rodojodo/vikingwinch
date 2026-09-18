import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {OperatorSelectPanel} from './OperatorSelectPanel';
import {getOperatorsForSquadron} from '../../../core/http/operatorsClient.ts';
import type {OperatorRead} from '../../../core/types/OperatorRead.ts';

vi.mock('../../../core/http/operatorsClient.ts', () => ({
    getOperatorsForSquadron: vi.fn(),
}));

describe('OperatorSelectPanel', () => {
    const mockOnSelectOperator = vi.fn();
    const squadronId = '123 VGS';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays a loading spinner initially', () => {
        vi.mocked(getOperatorsForSquadron).mockReturnValue(new Promise(() => {}));

        render(<OperatorSelectPanel squadronId={squadronId} onSelectOperator={mockOnSelectOperator} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Select an Operator' })).toBeInTheDocument();
    });

    it('displays operators when successfully fetched and calls onSelectOperator on click', async () => {
        const mockOperators = [
            { service_no: 'OFF-1001', name: 'Joe Bloggs', squadron_id: squadronId },
            { service_no: 'OFF-1002', name: 'Jane Doe', squadron_id: squadronId },
        ];
        vi.mocked(getOperatorsForSquadron).mockResolvedValue(mockOperators);

        render(<OperatorSelectPanel squadronId={squadronId} onSelectOperator={mockOnSelectOperator} />);

        const btn1 = await screen.findByRole('button', { name: 'Joe Bloggs' });
        const btn2 = screen.getByRole('button', { name: 'Jane Doe' });

        expect(btn1).toBeInTheDocument();
        expect(btn2).toBeInTheDocument();

        fireEvent.click(btn1);
        expect(mockOnSelectOperator).toHaveBeenCalledWith('OFF-1001');
    });

    it('displays an error message when API call fails', async () => {
        vi.mocked(getOperatorsForSquadron).mockRejectedValue(new Error('API error'));

        render(<OperatorSelectPanel squadronId={squadronId} onSelectOperator={mockOnSelectOperator} />);

        const errorMsg = await screen.findByText('Failed to load operators');
        expect(errorMsg).toBeInTheDocument();
    });

    it('displays a message when no operators are returned', async () => {
        vi.mocked(getOperatorsForSquadron).mockResolvedValue([]);

        render(<OperatorSelectPanel squadronId={squadronId} onSelectOperator={mockOnSelectOperator} />);

        const emptyMsg = await screen.findByText('No operators available for this squadron.');
        expect(emptyMsg).toBeInTheDocument();
    });

    it('displays a message when null is returned from API', async () => {
        vi.mocked(getOperatorsForSquadron).mockResolvedValue(null as unknown as OperatorRead[]);

        render(<OperatorSelectPanel squadronId={squadronId} onSelectOperator={mockOnSelectOperator} />);

        const emptyMsg = await screen.findByText('No operators available for this squadron.');
        expect(emptyMsg).toBeInTheDocument();
    });

    it('refetches operators when squadronId prop changes', async () => {
        const mockOperators1 = [
            { service_no: 'OFF-1001', name: 'Joe Bloggs', squadron_id: '123 VGS' },
        ];
        const mockOperators2 = [
            { service_no: 'OFF-2001', name: 'Alice Smith', squadron_id: '456 VGS' },
        ];
        vi.mocked(getOperatorsForSquadron)
            .mockResolvedValueOnce(mockOperators1)
            .mockResolvedValueOnce(mockOperators2);

        const { rerender } = render(<OperatorSelectPanel squadronId="123 VGS" onSelectOperator={mockOnSelectOperator} />);

        expect(await screen.findByRole('button', { name: 'Joe Bloggs' })).toBeInTheDocument();

        rerender(<OperatorSelectPanel squadronId="456 VGS" onSelectOperator={mockOnSelectOperator} />);

        expect(await screen.findByRole('button', { name: 'Alice Smith' })).toBeInTheDocument();
        expect(getOperatorsForSquadron).toHaveBeenCalledWith('456 VGS');
    });
});
