import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RemarksRepairsPanel from './RemarksRepairsPanel';

describe('RemarksRepairsPanel', () => {
    it('renders Remarks and Repairs toggle buttons', () => {
        render(<RemarksRepairsPanel />);
        expect(screen.getByRole('button', { name: /Remarks/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Repairs/i })).toBeInTheDocument();
    });

    it('toggles Remarks panel', () => {
        render(<RemarksRepairsPanel />);
        
        // Starts with no panel showing
        expect(screen.getByPlaceholderText('Enter launch remarks...')).not.toBeVisible();
        
        // Open Remarks
        fireEvent.click(screen.getByRole('button', { name: /Remarks/i }));
        
        expect(screen.getByText('Launch remarks')).toBeVisible();
        
        // Click Remarks again to close
        fireEvent.click(screen.getByRole('button', { name: /Remarks/i }));
        
        // Panel should be hidden
        expect(screen.getByText('Launch remarks')).not.toBeVisible();
    });

    it('toggles Repairs panel', () => {
        render(<RemarksRepairsPanel />);
        
        expect(screen.getByText('Repair details')).not.toBeVisible();

        // Open Repairs
        fireEvent.click(screen.getByRole('button', { name: /Repairs/i }));
        
        expect(screen.getByText('Repair details')).toBeVisible();
    });
});
