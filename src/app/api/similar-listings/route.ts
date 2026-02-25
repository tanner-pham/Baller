import { NextRequest, NextResponse } from 'next/server';

interface SimilarListing {
  itemId: string;
  title: string;
  price: number;
  location: string;
  image: string;
  link: string;
  similarityScore: number;
}
interface RapidApiListingItem {
  id?: string;
  itemId?: string;
  title?: string;
  name?: string;
  price?: string;
  location?: string;
  image?: string;
  thumbnail?: string;
  images?: string[];
  url?: string;
}

/**
 * Simple text similarity using word overlap (Jaccard similarity)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Searches Facebook Marketplace for similar listings
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const targetPrice = parseFloat(searchParams.get('targetPrice') || '0');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST ?? 'facebook-marketplace1.p.rapidapi.com';

    if (!rapidApiKey) {
      console.error('RAPIDAPI_KEY environment variable is not configured');
      return NextResponse.json({ error: 'API configuration missing' }, { status: 500 });
    }

    // Call RapidAPI Facebook Marketplace search
    const searchUrl = `https://${rapidApiHost}/search?query=${encodeURIComponent(query)}&location=seattle&radius=50`;
    
    console.info('Searching similar listings', { query, targetPrice, maxResults });

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost,
      },
    });

    if (!response.ok) {
      console.error('RapidAPI search failed', {
        status: response.status,
        statusText: response.statusText,
      });
      return NextResponse.json(
        { error: 'Failed to search marketplace' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const listings = data.results || data.items || [];

    // Calculate similarity scores and filter
    const similarListings: SimilarListing[] = listings
      .map((item: RapidApiListingItem) => ({
        itemId: item.id || item.itemId || '',
        title: item.title || item.name || '',
        price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0'),
        location: item.location || 'Unknown',
        image: item.image || item.thumbnail || item.images?.[0] || '',
        link: item.url || `https://www.facebook.com/marketplace/item/${item.id || item.itemId}`,
        similarityScore: calculateSimilarity(query, item.title || item.name || ''),
      }))
      .filter((listing: SimilarListing) => {
        // Filter by price range (±40% of target)
        if (targetPrice > 0) {
          const priceRatio = listing.price / targetPrice;
          if (priceRatio < 0.6 || priceRatio > 1.4) return false;
        }
        // Filter by similarity threshold
        return listing.similarityScore > 0.2;
      })
      .sort((a: SimilarListing, b: SimilarListing) => b.similarityScore - a.similarityScore)
      .slice(0, maxResults);

    console.info('Found similar listings', {
      query,
      count: similarListings.length,
      avgSimilarity: similarListings.reduce((sum, l) => sum + l.similarityScore, 0) / similarListings.length
    });

    return NextResponse.json({
      success: true,
      query,
      count: similarListings.length,
      listings: similarListings,
    });
  } catch (error) {
    console.error('Similar listings search error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to search similar listings',
      },
      { status: 500 }
    );
  }
}