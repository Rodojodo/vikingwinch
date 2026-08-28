import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach} from 'vitest'; // Compatible with Jest
import { BurnButton } from './BurnButton';

describe('BurnButton', () => {
  const defaultProps = {
    onClick: vi.fn(),
    isLoading: false,
    label: 'Burn Left',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the button with the specified label', () => {
    render(<BurnButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Burn Left' });
    expect(button).toBeInTheDocument();
  });

  it('executes the onClick callback when interacted with by a user', async () => {
    const user = userEvent.setup();
    render(<BurnButton {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Burn Left' });
    await user.click(button);

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the disabled attribute when isLoading is true', () => {
    render(<BurnButton {...defaultProps} isLoading={true} />);

    const button = screen.getByRole('button', { name: 'Burn Left' });
    expect(button).toBeDisabled();
  });
});