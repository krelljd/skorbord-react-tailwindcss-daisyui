import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerList from '../PlayerList';

describe('PlayerList', () => {
  it('renders player names', () => {
    render(<PlayerList players={[{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calls onSelect when a player is clicked', () => {
    const onSelect = vi.fn();
    render(<PlayerList players={[{ id: 1, name: 'Alice' }]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(onSelect).toHaveBeenCalledWith({ id: 1, name: 'Alice' });
  });
});
