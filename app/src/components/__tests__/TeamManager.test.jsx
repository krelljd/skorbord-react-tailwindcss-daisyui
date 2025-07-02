import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamManager from '../TeamManager';

describe('TeamManager', () => {
  const teams = [
    { id: 1, name: 'Team 1', players: [{ id: 1, name: 'Alice' }] },
    { id: 2, name: 'Team 2', players: [{ id: 2, name: 'Bob' }] },
  ];
  const availablePlayers = [{ id: 3, name: 'Charlie' }];

  it('renders teams and players', () => {
    render(
      <TeamManager
        teams={teams}
        availablePlayers={availablePlayers}
        onAddTeam={() => {}}
        onRemoveTeam={() => {}}
        onAddPlayerToTeam={() => {}}
        onRemovePlayerFromTeam={() => {}}
        onEditTeamName={() => {}}
        onEditPlayerName={() => {}}
      />
    );
    expect(screen.getByDisplayValue('Team 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Team 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
  });

  it('calls onAddTeam when add team button is clicked', () => {
    const onAddTeam = vi.fn();
    render(
      <TeamManager
        teams={teams}
        availablePlayers={availablePlayers}
        onAddTeam={onAddTeam}
        onRemoveTeam={() => {}}
        onAddPlayerToTeam={() => {}}
        onRemovePlayerFromTeam={() => {}}
        onEditTeamName={() => {}}
        onEditPlayerName={() => {}}
      />
    );
    fireEvent.click(screen.getByText('+ Add Team'));
    expect(onAddTeam).toHaveBeenCalled();
  });
});
