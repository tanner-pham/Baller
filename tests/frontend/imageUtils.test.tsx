import { getFirstNonVideoImage } from '@/src/app/dashboard/utils/imageUtils';

describe('getFirstNonVideoImage', () => {
  it('returns undefined for undefined input', () => {
    expect(getFirstNonVideoImage(undefined)).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(getFirstNonVideoImage([])).toBeUndefined();
  });

  it('returns the first image when none are videos', () => {
    const images = [
      'https://scontent.com/photo1.jpg',
      'https://scontent.com/photo2.jpg',
    ];
    expect(getFirstNonVideoImage(images)).toBe(images[0]);
  });

  it('skips video URLs and returns the first photo', () => {
    const images = [
      'https://scontent.com/v/some-video-id.mp4',
      'https://scontent.com/photo.jpg',
    ];
    expect(getFirstNonVideoImage(images)).toBe('https://scontent.com/photo.jpg');
  });

  it('detects various video URL patterns', () => {
    const videoUrls = [
      'https://cdn.fbcdn.net/v/t1.video/abc.mp4',
      'https://scontent-video-sea1.xx.fbcdn.net/thumb.jpg',
      'https://example.com/file.webm',
      'https://example.com/file.mov',
      'https://fbcdn.net/v42/media.jpg',
    ];
    const photo = 'https://scontent.com/photo.jpg';
    const images = [...videoUrls, photo];
    expect(getFirstNonVideoImage(images)).toBe(photo);
  });

  it('falls back to the first image if all are videos', () => {
    const images = [
      'https://cdn.fbcdn.net/v/video1.mp4',
      'https://cdn.fbcdn.net/v/video2.mp4',
    ];
    expect(getFirstNonVideoImage(images)).toBe(images[0]);
  });
});