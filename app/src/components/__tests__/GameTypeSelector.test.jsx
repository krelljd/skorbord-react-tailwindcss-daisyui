import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameTypeSelector from '../GameTypeSelector';

describe('GameTypeSelector', () => {
  const gameTypes = [
    { id: 1, name: 'Hearts' },
    { id: 2, name: 'Spades' },
  ];

  it('renders game type options', () => {
    render(<GameTypeSelector gameTypes={gameTypes} value={null} onChange={() => {}} />);
    expect(screen.getByText('Hearts')).toBeInTheDocument();
    expect(screen.getByText('Spades')).toBeInTheDocument();
  });

  it('calls onChange when a game type is selected', () => {
    const onChange = vi.fn();
    render(<GameTypeSelector gameTypes={gameTypes} value={null} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('shows favorite star if favorites prop is provided', () => {
    render(<GameTypeSelector gameTypes={gameTypes} value={1} onChange={() => {}} favorites={[1]} onToggleFavorite={() => {}} />);
    expect(screen.getByLabelText('Unfavorite')).toBeInTheDocument();
  });
});
