import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./LaunchPanel', () => ({
    default: () => <div data-testid="launch-panel-mock" />
}));

describe('App', () => {
    it('renders LaunchPanel inside a Box', () => {
        render(<App />);
        expect(screen.getByTestId('launch-panel-mock')).toBeInTheDocument();
    });
});
