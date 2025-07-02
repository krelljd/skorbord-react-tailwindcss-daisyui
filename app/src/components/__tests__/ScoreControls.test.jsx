import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoreControls from '../ScoreControls';

describe('ScoreControls', () => {
  it('renders the score value', () => {
    render(<ScoreControls value={10} onChange={() => {}} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onChange with incremented value', () => {
    const onChange = vi.fn();
    render(<ScoreControls value={5} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Increase score'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange with decremented value', () => {
    const onChange = vi.fn();
    render(<ScoreControls value={5} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Decrease score'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
