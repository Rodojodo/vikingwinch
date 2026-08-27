import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach} from 'vitest'; // Compatible with Jest
import { LaunchButton } from './LaunchButton';

describe('LaunchButton', () => {
  const defaultProps = {
    onClick: vi.fn(),
    isLoading: false,
    label: 'Left Drum',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the button with the specified label', () => {
    render(<LaunchButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Left Drum' });
    expect(button).toBeInTheDocument();
  });

  it('executes the onClick callback when interacted with by a user', async () => {
    const user = userEvent.setup();
    render(<LaunchButton {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Left Drum' });
    await user.click(button);

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the disabled attribute when isLoading is true', () => {
    render(<LaunchButton {...defaultProps} isLoading={true} />);

    const button = screen.getByRole('button', { name: 'Left Drum' });
    expect(button).toBeDisabled();
  });
});