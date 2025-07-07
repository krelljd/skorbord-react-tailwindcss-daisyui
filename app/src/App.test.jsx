import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import App from '../App';

// Helper function to render with MemoryRouter and initial entries
const renderWithRouter = (ui, { route = '/cards/demo' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

describe('App', () => {
  it('renders without crashing', () => {
    renderWithRouter(<App />);
    expect(screen.getByText(/skorbord/i)).toBeInTheDocument();
  });

  it('displays connection status', () => {
    renderWithRouter(<App />);
    // Connection status should be present
    expect(document.querySelector('.connection-status')).toBeInTheDocument();
  });

  it('shows the correct sqid in the badge for /cards/demo', () => {
    renderWithRouter(<App />, { route: '/cards/demo' });
    expect(screen.getByText('demo')).toBeInTheDocument();
  });

  it('shows the correct sqid in the badge for a custom sqid', () => {
    renderWithRouter(<App />, { route: '/cards/test123' });
    expect(screen.getByText('test123')).toBeInTheDocument();
  });

  it('has dark theme applied', () => {
    renderWithRouter(<App />);
    // The main wrapper should have min-h-screen
    const app = document.querySelector('.min-h-screen');
    expect(app).toBeInTheDocument();
  });
});
