/**
 * Known Facebook video CDN URL patterns that indicate a video rather than a photo.
 */
const VIDEO_URL_PATTERNS = [
  /\/v\//i,
  /video/i,
  /\.mp4/i,
  /\.webm/i,
  /\.mov/i,
  /fbcdn.*\/v\d+/i,
  /scontent.*video/i,
];

/**
 * Returns true if a URL looks like a video resource rather than a static image.
 */
function looksLikeVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Returns the first non-video image URL from an array of image URLs.
 * Falls back to the first image if all appear to be videos.
 */
export function getFirstNonVideoImage(images: string[] | undefined): string | undefined {
  if (!images || images.length === 0) {
    return undefined;
  }

  const firstPhoto = images.find((url) => !looksLikeVideoUrl(url));
  return firstPhoto ?? images[0];
}
