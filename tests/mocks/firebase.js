import { vi } from 'vitest';

// Create mock functions
export const mockGetDocs = vi.fn();
export const mockAddDoc = vi.fn();
export const mockUpdateDoc = vi.fn();
export const mockCollection = vi.fn();
export const mockQuery = vi.fn();
export const mockOrderBy = vi.fn();
export const mockDoc = vi.fn();

// Helper to create mock restaurant data
export const createMockRestaurant = (overrides = {}) => ({
  id: 'resto-1',
  name: 'Test Restaurant',
  type: 'Italien',
  halal: 'Non',
  googleRating: 4.5,
  googleRatingCount: 100,
  googleAddress: '123 Test St, Paris',
  googlePhone: '+33123456789',
  googleWebsite: 'https://test-restaurant.com',
  googlePriceLevel: 'PRICE_LEVEL_MODERATE',
  googleOpeningHours: ['Mon-Fri: 9am-10pm'],
  userRatings: [
    {
      userName: 'John',
      rating: 5,
      comment: 'Great food!',
      date: '2024-01-01T00:00:00.000Z',
    },
  ],
  coords: [48.8566, 2.3522],
  gmaps: 'https://maps.google.com/?q=Test+Restaurant',
  ...overrides,
});

// Helper to create mock query snapshot
export const createMockQuerySnapshot = (restaurants = []) => ({
  docs: restaurants.map((resto) => ({
    id: resto.id,
    data: () => {
      const { id: _id, ...data } = resto;
      return data;
    },
  })),
  empty: restaurants.length === 0,
  size: restaurants.length,
});

// Helper to reset all mocks
export const resetFirebaseMocks = () => {
  mockGetDocs.mockReset();
  mockAddDoc.mockReset();
  mockUpdateDoc.mockReset();
  mockCollection.mockReset();
  mockQuery.mockReset();
  mockOrderBy.mockReset();
  mockDoc.mockReset();
};
