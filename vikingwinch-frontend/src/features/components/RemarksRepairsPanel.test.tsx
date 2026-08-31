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
        expect(screen.queryByPlaceholderText('Enter launch remarks...')).not.toBeInTheDocument();
        
        // Open Remarks
        fireEvent.click(screen.getByRole('button', { name: /Remarks/i }));
        
        // Assume RemarksPanel renders something we can query (like the placeholder text)
        expect(screen.getByText('Launch remarks')).toBeInTheDocument();
        
        // Click Remarks again to close
        fireEvent.click(screen.getByRole('button', { name: /Remarks/i }));
        
        // Panel should be hidden
        expect(screen.queryByText('Launch remarks')).not.toBeInTheDocument();
    });

    it('toggles Repairs panel', () => {
        render(<RemarksRepairsPanel />);
        
        // Open Repairs
        fireEvent.click(screen.getByRole('button', { name: /Repairs/i }));
        
        expect(screen.getByText('Repair details')).toBeInTheDocument();
    });
});
