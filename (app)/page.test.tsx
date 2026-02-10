/**
 * Frontend Unit Tests - Home Page Component (Jest + React Testing Library)
 * Tests that core UI elements render correctly
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';

// Mock next/image since Jest doesn't handle Next.js internals
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

describe('Home Page', () => {
  test('renders the page without crashing', () => {
    render(<Home />);
  });

  test('renders the main heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  test('renders the Deploy Now link', () => {
    render(<Home />);
    expect(screen.getByText('Deploy Now')).toBeInTheDocument();
  });

  test('renders the Documentation link', () => {
    render(<Home />);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  test('Deploy Now link points to Vercel', () => {
    render(<Home />);
    const link = screen.getByText('Deploy Now').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('vercel.com'));
  });
});
