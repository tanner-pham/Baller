const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Downloads an image and converts it to a base64 data URL for model compatibility.
 */
export async function fetchImageAsDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://www.facebook.com/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error('Condition assessment image fetch failed:', {
        imageUrl,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim();

    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Condition assessment image fetch returned non-image content type:', {
        imageUrl,
        contentType,
      });
      return null;
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    if (imageBuffer.byteLength === 0 || imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      console.error('Condition assessment image fetch returned invalid size:', {
        imageUrl,
        bytes: imageBuffer.byteLength,
        maxBytes: MAX_IMAGE_BYTES,
      });
      return null;
    }

    return `data:${contentType};base64,${imageBuffer.toString('base64')}`;
  } catch (caughtError) {
    console.error('Condition assessment image fetch threw an error:', {
      imageUrl,
      error: caughtError,
    });
    return null;
  }
}
