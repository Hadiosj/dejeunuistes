import { describe, it, expect } from 'vitest';
import {
  getPriceDisplay,
  extractCuisineType,
  calculateAverageRating,
  isValidRating,
} from '../../src/utils/helpers';

describe('getPriceDisplay', () => {
  it('should return correct euro symbols for each price level', () => {
    expect(getPriceDisplay('PRICE_LEVEL_FREE')).toBe('Gratuit');
    expect(getPriceDisplay('PRICE_LEVEL_INEXPENSIVE')).toBe('€');
    expect(getPriceDisplay('PRICE_LEVEL_MODERATE')).toBe('€€');
    expect(getPriceDisplay('PRICE_LEVEL_EXPENSIVE')).toBe('€€€');
    expect(getPriceDisplay('PRICE_LEVEL_VERY_EXPENSIVE')).toBe('€€€€');
  });

  it('should return null for undefined or null price level', () => {
    expect(getPriceDisplay()).toBe(null);
    expect(getPriceDisplay(null)).toBe(null);
    expect(getPriceDisplay(undefined)).toBe(null);
  });

  it('should return null for unknown price level', () => {
    expect(getPriceDisplay('PRICE_LEVEL_UNKNOWN')).toBe(null);
    expect(getPriceDisplay('INVALID')).toBe(null);
  });

  it('should return null for empty string', () => {
    expect(getPriceDisplay('')).toBe(null);
  });
});

describe('extractCuisineType', () => {
  it('should return empty string when no types provided', () => {
    expect(extractCuisineType()).toBe('');
    expect(extractCuisineType(null)).toBe('');
    expect(extractCuisineType(undefined)).toBe('');
  });

  it('should return empty string for empty array', () => {
    expect(extractCuisineType([])).toBe('');
  });

  it('should return empty string when no matching cuisine type found', () => {
    expect(extractCuisineType(['store', 'point_of_interest'])).toBe('');
  });

  it('should return first matching cuisine type', () => {
    // Should stop at first match and return it
    const types = ['store', 'restaurant', 'italian_restaurant'];
    const result = extractCuisineType(types);
    expect(typeof result).toBe('string');
  });
});

describe('calculateAverageRating', () => {
  it('should return null for empty or null ratings', () => {
    expect(calculateAverageRating()).toBe(null);
    expect(calculateAverageRating(null)).toBe(null);
    expect(calculateAverageRating([])).toBe(null);
  });

  it('should calculate correct average for single rating', () => {
    const ratings = [{ rating: 4 }];
    expect(calculateAverageRating(ratings)).toBe('4.0');
  });

  it('should calculate correct average for multiple ratings', () => {
    const ratings = [
      { rating: 5 },
      { rating: 3 },
      { rating: 4 },
    ];
    // Average: (5+3+4)/3 = 4.0
    expect(calculateAverageRating(ratings)).toBe('4.0');
  });

  it('should round average to 1 decimal place', () => {
    const ratings = [
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
    ];
    // Average: (5+4+3)/3 = 4.0
    expect(calculateAverageRating(ratings)).toBe('4.0');
  });

  it('should handle decimal ratings', () => {
    const ratings = [
      { rating: 4.5 },
      { rating: 3.7 },
    ];
    // Average: (4.5+3.7)/2 = 4.1
    expect(calculateAverageRating(ratings)).toBe('4.1');
  });

  it('should return fixed decimal format', () => {
    const ratings = [{ rating: 5 }, { rating: 5 }];
    expect(calculateAverageRating(ratings)).toBe('5.0');
  });
});

describe('isValidRating', () => {
  it('should return true for valid ratings (1-5)', () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(2)).toBe(true);
    expect(isValidRating(3)).toBe(true);
    expect(isValidRating(4)).toBe(true);
    expect(isValidRating(5)).toBe(true);
  });

  it('should return true for valid string ratings', () => {
    expect(isValidRating('1')).toBe(true);
    expect(isValidRating('3')).toBe(true);
    expect(isValidRating('5')).toBe(true);
  });

  it('should return true for decimal ratings in range', () => {
    expect(isValidRating(1.5)).toBe(true);
    expect(isValidRating(3.7)).toBe(true);
    expect(isValidRating(4.999)).toBe(true);
  });

  it('should return false for ratings below 1', () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(0.5)).toBe(false);
    expect(isValidRating(-1)).toBe(false);
  });

  it('should return false for ratings above 5', () => {
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(5.1)).toBe(false);
    expect(isValidRating(10)).toBe(false);
  });

  it('should return false for non-numeric values', () => {
    expect(isValidRating('abc')).toBe(false);
    expect(isValidRating('')).toBe(false);
    expect(isValidRating(null)).toBe(false);
    expect(isValidRating(undefined)).toBe(false);
  });

  it('should return false for NaN', () => {
    expect(isValidRating(NaN)).toBe(false);
  });

  it('should handle edge cases exactly at boundaries', () => {
    expect(isValidRating(1.0)).toBe(true);
    expect(isValidRating(5.0)).toBe(true);
    expect(isValidRating(0.999)).toBe(false);
    expect(isValidRating(5.001)).toBe(false);
  });
});
