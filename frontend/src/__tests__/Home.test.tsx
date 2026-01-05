import { render, screen } from '@testing-library/react';
import Home from '../app/page';
import { useAuth } from '@/features/auth/hooks/AuthContext';

// Mock useAuth
jest.mock('@/features/auth/hooks/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('Home Page', () => {
  it('renders progress and map sections', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      signOut: jest.fn(),
    });

    render(<Home />);

    expect(screen.getByText(/Uganda Campaign Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Rallies/i)).toBeInTheDocument();
    expect(screen.getByText(/High Congestion Areas/i)).toBeInTheDocument();
  });
});
