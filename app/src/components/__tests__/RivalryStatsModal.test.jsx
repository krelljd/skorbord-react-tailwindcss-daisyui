import React from 'react';
import { render, screen } from '@testing-library/react';
import RivalryStatsModal from '../RivalryStatsModal';

describe('RivalryStatsModal', () => {
  const stats = {
    team1_name: 'Team 1',
    team2_name: 'Team 2',
    avg_margin: 7.2,
    last_10: 'WWWLLLWLWL',
    min_win: 2,
    max_win: 15,
  };

  it('renders rivalry stats when open', () => {
    render(
      <RivalryStatsModal open={true} onClose={() => {}} stats={stats} />
    );

    // Check for content using more flexible matchers
    expect(screen.getByText(/Team 1/)).toBeInTheDocument();
    expect(screen.getByText(/Team 2/)).toBeInTheDocument();
    expect(screen.getByText(/vs/)).toBeInTheDocument();

    // Check for stats
    expect(screen.getByText('7.2')).toBeInTheDocument();
    expect(screen.getByText('Avg Margin')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    // Check for modal title
    expect(screen.getByText(/Rivalry Statistics/)).toBeInTheDocument();
  });

  it('does not render when not open', () => {
    render(
      <RivalryStatsModal open={false} onClose={() => {}} stats={stats} />
    );
    expect(screen.queryByText(/Team 1/)).toBeNull();
  });
});
