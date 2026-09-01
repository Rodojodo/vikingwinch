import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./WinchTab', () => ({
    default: () => <div data-testid="winch-tab-mock" />
}));

describe('App', () => {
    it('renders WinchTab', () => {
        render(<App />);
        expect(screen.getByTestId('winch-tab-mock')).toBeInTheDocument();
    });
});
