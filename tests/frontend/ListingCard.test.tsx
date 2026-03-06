import { render, screen, fireEvent } from '@testing-library/react';
import ListingCard from '@/src/app/dashboard/(components)/ListingCard';

// Mock next/link to render as a plain anchor tag
jest.mock('next/link', () => {
  return ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

describe('ListingCard Component', () => {
  const defaultProps = {
    title: 'MacBook Pro 2020',
    location: 'Seattle, WA',
    price: 800,
    image: 'https://example.com/image.jpg',
    link: 'https://facebook.com/marketplace/item/123',
  };

  const ballerUrl = '/dashboard?listingUrl=https%3A%2F%2Ffacebook.com%2Fmarketplace%2Fitem%2F123';

  describe('with ballerUrl provided', () => {
    it('renders "VIEW LISTING" text', () => {
      render(<ListingCard {...defaultProps} ballerUrl={ballerUrl} />);
      expect(screen.getByText('VIEW LISTING')).toBeInTheDocument();
    });

    it('renders "RUN IN BALLER" text', () => {
      render(<ListingCard {...defaultProps} ballerUrl={ballerUrl} />);
      expect(screen.getByText('RUN IN BALLER')).toBeInTheDocument();
    });

    it('renders both buttons simultaneously (two buttons side by side)', () => {
      render(<ListingCard {...defaultProps} ballerUrl={ballerUrl} />);
      expect(screen.getByText('VIEW LISTING')).toBeInTheDocument();
      expect(screen.getByText('RUN IN BALLER')).toBeInTheDocument();
    });

    it('renders "VIEW LISTING" inside a plain anchor with correct attributes', () => {
      render(<ListingCard {...defaultProps} ballerUrl={ballerUrl} />);
      const viewLink = screen.getByText('VIEW LISTING').closest('a');
      expect(viewLink).toHaveAttribute('href', defaultProps.link);
      expect(viewLink).toHaveAttribute('target', '_blank');
      expect(viewLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders "RUN IN BALLER" inside a Next.js Link with correct href', () => {
      render(<ListingCard {...defaultProps} ballerUrl={ballerUrl} />);
      const ballerLink = screen.getByText('RUN IN BALLER').closest('a');
      expect(ballerLink).toHaveAttribute('href', ballerUrl);
    });

    it('shows hover expand subtext for VIEW LISTING on hover', () => {
      render(<ListingCard {...defaultProps} ballerUrl={ballerUrl} />);
      const viewBtn = screen.getByText('VIEW LISTING').closest('a')!.parentElement!;
      fireEvent.mouseEnter(viewBtn);
      expect(screen.getByText('View on Facebook')).toBeInTheDocument();
    });

    it('shows hover expand subtext for RUN IN BALLER on hover', () => {
      render(<ListingCard {...defaultProps} ballerUrl={ballerUrl} />);
      const ballerBtn = screen.getByText('RUN IN BALLER').closest('a')!.parentElement!;
      fireEvent.mouseEnter(ballerBtn);
      expect(screen.getByText('Full price analysis')).toBeInTheDocument();
    });
  });

  describe('without ballerUrl (backward compatibility)', () => {
    it('renders only "VIEW LISTING" button', () => {
      render(<ListingCard {...defaultProps} />);
      expect(screen.getByText('VIEW LISTING')).toBeInTheDocument();
    });

    it('does not render "RUN IN BALLER" button', () => {
      render(<ListingCard {...defaultProps} />);
      expect(screen.queryByText('RUN IN BALLER')).not.toBeInTheDocument();
    });
  });
});
