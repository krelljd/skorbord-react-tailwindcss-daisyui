import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import App from '../App';

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
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

  it('shows main navigation', () => {
    renderWithRouter(<App />);
    // Should have main card app content
    expect(screen.getByText(/card scoring/i)).toBeInTheDocument();
  });

  it('has dark theme applied', () => {
    renderWithRouter(<App />);
    const app = document.querySelector('.app');
    expect(app).toHaveClass('min-h-screen');
  });
});
