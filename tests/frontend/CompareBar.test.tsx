import { render, screen, fireEvent } from '@testing-library/react';
import { CompareBar } from '@/src/app/dashboard/(components)/CompareBar';
import type { CompareSelection } from '@/src/app/dashboard/(components)/SimilarListings';

// Mock next/link to render as a plain anchor tag
jest.mock('next/link', () => {
  return ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

describe('CompareBar Component', () => {
  const mockOnRemove = jest.fn();
  const mockOnClear = jest.fn();

  const selection1: CompareSelection = {
    url: 'https://facebook.com/marketplace/item/123',
    title: 'MacBook Pro 2020',
    price: '$800',
    image: 'https://example.com/image1.jpg',
  };

  const selection2: CompareSelection = {
    url: 'https://facebook.com/marketplace/item/456',
    title: 'Dell XPS 13',
    price: '$600',
    image: 'https://example.com/image2.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when selections is empty', () => {
    const { container } = render(
      <CompareBar selections={[]} onRemove={mockOnRemove} onClear={mockOnClear} />
    );
    expect(container.firstChild).toBeNull();
  });

  describe('with 1 selection', () => {
    it('renders one selection chip with title', () => {
      render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      expect(screen.getByText('MacBook Pro 2020')).toBeInTheDocument();
    });

    it('renders helper text "Select 1 more listing"', () => {
      render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      expect(screen.getByText('Select 1 more listing')).toBeInTheDocument();
    });

    it('renders X remove button on chip', () => {
      render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const removeButtons = screen.getAllByLabelText(/remove/i);
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onRemove when X button is clicked', () => {
      render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const removeBtn = screen.getAllByLabelText(/remove/i)[0];
      fireEvent.click(removeBtn);
      expect(mockOnRemove).toHaveBeenCalledWith(selection1);
    });

    it('renders Compare button as disabled (not a link)', () => {
      render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const compareBtn = screen.getByText('COMPARE');
      // When disabled, it should be a span, not inside a link
      const closestLink = compareBtn.closest('a');
      expect(closestLink).toBeNull();
    });

    it('renders Compare button with gray/disabled styling', () => {
      render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      // The outer wrapper span contains the disabled styling classes
      const innerSpan = screen.getByText('COMPARE');
      const outerSpan = innerSpan.parentElement;
      expect(outerSpan?.tagName).toBe('SPAN');
      expect(outerSpan?.className).toContain('bg-gray-300');
      expect(outerSpan?.className).toContain('cursor-not-allowed');
    });
  });

  describe('with 2 selections', () => {
    it('renders two selection chips', () => {
      render(
        <CompareBar selections={[selection1, selection2]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      expect(screen.getByText('MacBook Pro 2020')).toBeInTheDocument();
      expect(screen.getByText('Dell XPS 13')).toBeInTheDocument();
    });

    it('renders Compare button as active link', () => {
      render(
        <CompareBar selections={[selection1, selection2]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const compareBtn = screen.getByText('COMPARE').closest('a');
      expect(compareBtn).not.toBeNull();
    });

    it('Compare button href is /compare?left={sel0.url}&right={sel1.url}', () => {
      render(
        <CompareBar selections={[selection1, selection2]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const compareLink = screen.getByText('COMPARE').closest('a');
      const expectedHref = `/compare?left=${encodeURIComponent(selection1.url)}&right=${encodeURIComponent(selection2.url)}`;
      expect(compareLink).toHaveAttribute('href', expectedHref);
    });

    it('Compare button uses pink active styling', () => {
      render(
        <CompareBar selections={[selection1, selection2]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const compareLink = screen.getByText('COMPARE').closest('a');
      expect(compareLink?.className).toContain('bg-[#FF69B4]');
    });
  });

  describe('layout and positioning', () => {
    it('has fixed positioning at bottom with z-40', () => {
      const { container } = render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const bar = container.firstChild as HTMLElement;
      expect(bar.className).toContain('fixed');
      expect(bar.className).toContain('bottom-0');
      expect(bar.className).toContain('z-40');
    });

    it('uses neobrutalist border styling', () => {
      const { container } = render(
        <CompareBar selections={[selection1]} onRemove={mockOnRemove} onClear={mockOnClear} />
      );
      const bar = container.firstChild as HTMLElement;
      expect(bar.className).toContain('border-t');
      expect(bar.className).toContain('border-black');
    });
  });
});
