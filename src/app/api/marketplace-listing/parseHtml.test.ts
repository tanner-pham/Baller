import {
  extractDescriptionFromText,
  extractLocationFromText,
  stripMeetupPreference,
} from './parseHtml';

describe('extractDescriptionFromText', () => {
  it('stops at "See more" and returns text before it', () => {
    const input = 'Description Great car runs well See more Federal Way, WA Seller details';
    expect(extractDescriptionFromText(input)).toBe('Great car runs well');
  });

  it('stops at "See less" and returns text before it', () => {
    const input = 'Description Full text here See less Seller details';
    expect(extractDescriptionFromText(input)).toBe('Full text here');
  });

  it('stops at "Read more" and returns text before it', () => {
    const input = 'Description Nice item Read more Location Seattle';
    expect(extractDescriptionFromText(input)).toBe('Nice item');
  });

  it('still stops at original stop words like "Seller details"', () => {
    const input = 'Description Works great Seller details Bob';
    expect(extractDescriptionFromText(input)).toBe('Works great');
  });

  it('returns undefined for descriptions shorter than 10 characters', () => {
    const input = 'Description Short';
    expect(extractDescriptionFromText(input)).toBeUndefined();
  });
});

describe('extractLocationFromText', () => {
  it('matches "See more City, ST" pattern', () => {
    const input = 'See more Federal Way, WA Seller details';
    expect(extractLocationFromText(input)).toBe('Federal Way, WA');
  });

  it('matches "Listed in City, ST" pattern', () => {
    const input = 'Listed in Seattle, WA Seller details';
    expect(extractLocationFromText(input)).toBe('Seattle, WA');
  });

  it('matches standalone "City, ST" between section markers', () => {
    const input = 'Condition Used - Good Federal Way, WA Seller details';
    expect(extractLocationFromText(input)).toBe('Federal Way, WA');
  });

  it('returns undefined when no location-like text found', () => {
    const input = 'Great car runs well no location info here';
    expect(extractLocationFromText(input)).toBeUndefined();
  });

  it('strips meetup preference text like "Public meetup"', () => {
    const input = 'See more Federal Way, WA Public meetup Seller details';
    const location = extractLocationFromText(input);
    const stripped = stripMeetupPreference(location);
    expect(stripped).toBe('Federal Way, WA');
  });
});
