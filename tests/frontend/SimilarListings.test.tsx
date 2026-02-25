import { render, screen } from '@testing-library/react';
import { SimilarListings } from '@/src/app/dashboard/(components)/SimilarListings';

describe('SimilarListings Component', () => {
  const mockListings = [
    {
      title: 'MacBook Pro 2020',
      location: 'Seattle, WA',
      price: 800,
      image: 'https://example.com/image1.jpg',
      link: 'https://facebook.com/marketplace/item/123',
    },
    {
      title: 'Dell XPS 13',
      location: 'Bellevue, WA',
      price: 600,
      image: 'https://example.com/image2.jpg',
      link: 'https://facebook.com/marketplace/item/456',
    },
  ];

  it('renders the similar listings heading', () => {
    render(<SimilarListings listings={mockListings} />);
    expect(screen.getByText('SIMILAR LISTINGS')).toBeInTheDocument();
  });

  it('renders all provided listings', () => {
    render(<SimilarListings listings={mockListings} />);
    expect(screen.getByText('MacBook Pro 2020')).toBeInTheDocument();
    expect(screen.getByText('Dell XPS 13')).toBeInTheDocument();
  });

  it('displays listing prices', () => {
    render(<SimilarListings listings={mockListings} />);
    expect(screen.getByText('$800')).toBeInTheDocument();
    expect(screen.getByText('$600')).toBeInTheDocument();
  });

  it('displays listing locations', () => {
    render(<SimilarListings listings={mockListings} />);
    expect(screen.getByText('Seattle, WA')).toBeInTheDocument();
    expect(screen.getByText('Bellevue, WA')).toBeInTheDocument();
  });

  it('renders empty state when no listings provided', () => {
    render(<SimilarListings listings={[]} />);
    expect(screen.getByText('SIMILAR LISTINGS')).toBeInTheDocument();
  });
});
