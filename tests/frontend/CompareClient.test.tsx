import { render, screen } from '@testing-library/react';

// Mock next/navigation
const mockGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock hooks
const mockUseMarketplaceListing = jest.fn();
const mockUseConditionAssessment = jest.fn();

jest.mock('@/src/app/dashboard/hooks/useMarketplaceListing', () => ({
  useMarketplaceListing: (...args: unknown[]) => mockUseMarketplaceListing(...args),
}));

jest.mock('@/src/app/dashboard/hooks/useConditionAssessment', () => ({
  useConditionAssessment: (...args: unknown[]) => mockUseConditionAssessment(...args),
}));

// Mock useCompareVerdict to avoid real fetch calls in tests
jest.mock('@/src/app/compare/hooks/useCompareVerdict', () => ({
  useCompareVerdict: () => ({ verdict: null, isLoading: false, error: '' }),
}));

// Must import AFTER mocks are set up
import CompareClient from '@/src/app/compare/CompareClient';

const leftUrl = 'https://www.facebook.com/marketplace/item/111/';
const rightUrl = 'https://www.facebook.com/marketplace/item/222/';

const baseListing = {
  itemId: '111',
  title: 'MacBook Pro 2021',
  price: '$1,200',
  images: ['https://example.com/photo.jpg'],
  location: 'Seattle, WA',
  listingDate: '2 days ago',
  description: 'Great laptop',
  similarListings: [{ title: 'Similar', location: 'Portland', price: 1100, image: 'https://example.com/s1.jpg', link: 'https://facebook.com/marketplace/item/999' }],
};

const baseAssessment = {
  conditionScore: 0.85,
  conditionLabel: 'Excellent',
  modelAccuracy: '92',
  topReasons: ['Well maintained'],
  suggestedOffer: '$1,050',
  negotiationTip: 'Mention wear.',
};

function setupMocks(overrides: {
  leftLoading?: boolean;
  rightLoading?: boolean;
  leftError?: string;
  rightError?: string;
  leftListing?: typeof baseListing | null;
  rightListing?: typeof baseListing | null;
  leftResolved?: boolean;
  rightResolved?: boolean;
} = {}) {
  const {
    leftLoading = false,
    rightLoading = false,
    leftError = '',
    rightError = '',
    leftListing = baseListing,
    rightListing = { ...baseListing, itemId: '222', title: 'Dell XPS 15' },
    leftResolved = true,
    rightResolved = true,
  } = overrides;

  let listingCallCount = 0;
  mockUseMarketplaceListing.mockImplementation(() => {
    listingCallCount++;
    if (listingCallCount % 2 === 1) {
      return { listing: leftListing, isLoading: leftLoading, error: leftError };
    }
    return { listing: rightListing, isLoading: rightLoading, error: rightError };
  });

  let assessmentCallCount = 0;
  mockUseConditionAssessment.mockImplementation(() => {
    assessmentCallCount++;
    if (assessmentCallCount % 2 === 1) {
      return { assessment: baseAssessment, isLoading: false, hasResolved: leftResolved, error: '' };
    }
    return { assessment: baseAssessment, isLoading: false, hasResolved: rightResolved, error: '' };
  });
}

describe('CompareClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation((key: string) => {
      if (key === 'left') return leftUrl;
      if (key === 'right') return rightUrl;
      return null;
    });
  });

  it('renders two ComparisonColumn components when both listings are loaded', () => {
    setupMocks();
    const { container } = render(<CompareClient />);
    expect(container.querySelector('[data-testid="comparison-column-left"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="comparison-column-right"]')).toBeInTheDocument();
  });

  it('renders ColumnSkeleton for right column while right listing is loading', () => {
    setupMocks({ rightLoading: true, rightResolved: false });
    const { container } = render(<CompareClient />);
    expect(container.querySelector('[data-testid="comparison-column-left"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="column-skeleton"]')).toBeInTheDocument();
  });

  it('renders breadcrumb "Back to Analysis" link at top', () => {
    setupMocks();
    render(<CompareClient />);
    const breadcrumb = screen.getByText(/back to analysis/i);
    expect(breadcrumb).toBeInTheDocument();
    const link = breadcrumb.closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('/dashboard'));
  });

  it('reads left and right URLs from searchParams', () => {
    setupMocks();
    render(<CompareClient />);
    expect(mockGet).toHaveBeenCalledWith('left');
    expect(mockGet).toHaveBeenCalledWith('right');
  });

  it('shows error state if left === right URL (same listing)', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'left') return leftUrl;
      if (key === 'right') return leftUrl;
      return null;
    });
    setupMocks();
    render(<CompareClient />);
    expect(screen.getByText(/comparing the same listing/i)).toBeInTheDocument();
  });

  it('shows error state for failed column load', () => {
    setupMocks({ rightError: 'Failed to load listing', rightListing: null });
    render(<CompareClient />);
    expect(screen.getByText(/unable to load this listing/i)).toBeInTheDocument();
  });
});
