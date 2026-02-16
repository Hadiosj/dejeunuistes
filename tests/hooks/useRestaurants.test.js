import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRestaurants } from '../../src/hooks/useRestaurants';

// Get the mocked Firebase functions from the global setup
// These are already mocked in tests/setup.js to prevent real Firebase connections
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';

// Type cast to access vi.fn() methods
const mockGetDocs = getDocs;
const mockAddDoc = addDoc;
const mockUpdateDoc = updateDoc;
const mockCollection = collection;
const mockQuery = query;
const mockOrderBy = orderBy;
const mockDoc = doc;

// Helper to create mock restaurant data
const createMockRestaurant = (overrides = {}) => ({
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
const createMockQuerySnapshot = (restaurants = []) => ({
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

describe('useRestaurants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockCollection.mockReturnValue('mock-collection');
    mockOrderBy.mockReturnValue('mock-orderby');
    mockQuery.mockReturnValue('mock-query');
    mockDoc.mockReturnValue('mock-doc-ref');
  });

  describe('refreshRestaurants', () => {
    it('should fetch and set restaurants on mount', async () => {
      const mockRestaurants = [
        createMockRestaurant({ id: 'resto-1', name: 'Restaurant 1' }),
        createMockRestaurant({ id: 'resto-2', name: 'Restaurant 2' }),
      ];

      mockGetDocs.mockResolvedValueOnce(createMockQuerySnapshot(mockRestaurants));

      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toHaveLength(2);
      });

      expect(result.current.restos[0].name).toBe('Restaurant 1');
      expect(result.current.restos[1].name).toBe('Restaurant 2');
    });

    it('should handle empty restaurant list', async () => {
      mockGetDocs.mockResolvedValueOnce(createMockQuerySnapshot([]));

      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toHaveLength(0);
      });
    });

    it('should set error when fetch fails', async () => {
      const mockError = new Error('permission-denied');
      mockGetDocs.mockRejectedValueOnce(mockError);
      mockAddDoc.mockResolvedValue({}); // Mock error logging

      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('saveRestaurant', () => {
    beforeEach(() => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));
      mockAddDoc.mockResolvedValue({ id: 'new-resto-id' });
    });

    it('should successfully save a valid restaurant', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const validFormData = {
        name: 'New Restaurant',
        type: 'Italien',
        halal: 'Oui',
        googleRating: 4.5,
        googleRatingCount: 100,
        googleAddress: '123 Test St',
        googlePhone: '+33123456789',
        googleWebsite: 'https://test.com',
        googlePriceLevel: 'PRICE_LEVEL_MODERATE',
        googleOpeningHours: ['Mon-Fri: 9am-10pm'],
        coords: [48.8566, 2.3522],
        gmaps: 'https://maps.google.com',
        initialUserName: 'John',
        initialRating: '4',
        initialRatingComment: 'Great!',
      };

      let success;
      await act(async () => {
        success = await result.current.saveRestaurant(validFormData);
      });

      expect(success).toBe(true);
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should reject restaurant without halal certification', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const invalidFormData = {
        name: 'Test Restaurant',
        type: 'Italien',
        halal: '', // Missing
        coords: [48.8566, 2.3522],
        initialUserName: 'John',
        initialRating: '4',
      };

      let success;
      await act(async () => {
        success = await result.current.saveRestaurant(invalidFormData);
      });

      expect(success).toBe(false);
      // Check that addDoc was only called for error logging (once), not for saving restaurant
      const restaurantSaveCalls = mockAddDoc.mock.calls.filter(
        call => call[1] && call[1].name === 'Test Restaurant'
      );
      expect(restaurantSaveCalls).toHaveLength(0);
    });

    it('should reject restaurant without cuisine type', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const invalidFormData = {
        name: 'Test Restaurant',
        type: '', // Missing
        halal: 'Non',
        coords: [48.8566, 2.3522],
        initialUserName: 'John',
        initialRating: '4',
      };

      let success;
      await act(async () => {
        success = await result.current.saveRestaurant(invalidFormData);
      });

      expect(success).toBe(false);
      // Check that addDoc was only called for error logging, not for saving restaurant
      const restaurantSaveCalls = mockAddDoc.mock.calls.filter(
        call => call[1] && call[1].name === 'Test Restaurant'
      );
      expect(restaurantSaveCalls).toHaveLength(0);
    });

    it('should require custom type when type is "Autre"', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const invalidFormData = {
        name: 'Test Restaurant',
        type: 'Autre',
        customType: '', // Missing custom type
        halal: 'Non',
        coords: [48.8566, 2.3522],
        initialUserName: 'John',
        initialRating: '4',
      };

      let success;
      await act(async () => {
        success = await result.current.saveRestaurant(invalidFormData);
      });

      expect(success).toBe(false);
      // Check that addDoc was only called for error logging, not for saving restaurant
      const restaurantSaveCalls = mockAddDoc.mock.calls.filter(
        call => call[1] && call[1].name === 'Test Restaurant'
      );
      expect(restaurantSaveCalls).toHaveLength(0);
    });

    it('should reject restaurant without coordinates', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const invalidFormData = {
        name: 'Test Restaurant',
        type: 'Italien',
        halal: 'Non',
        coords: null, // Missing
        initialUserName: 'John',
        initialRating: '4',
      };

      let success;
      await act(async () => {
        success = await result.current.saveRestaurant(invalidFormData);
      });

      expect(success).toBe(false);
      // Check that addDoc was only called for error logging, not for saving restaurant
      const restaurantSaveCalls = mockAddDoc.mock.calls.filter(
        call => call[1] && call[1].name === 'Test Restaurant'
      );
      expect(restaurantSaveCalls).toHaveLength(0);
    });

    it('should reject invalid rating (out of range)', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const invalidFormData = {
        name: 'Test Restaurant',
        type: 'Italien',
        halal: 'Non',
        coords: [48.8566, 2.3522],
        initialUserName: 'John',
        initialRating: '6', // Invalid (> 5)
      };

      let success;
      await act(async () => {
        success = await result.current.saveRestaurant(invalidFormData);
      });

      expect(success).toBe(false);
      // Check that addDoc was only called for error logging, not for saving restaurant
      const restaurantSaveCalls = mockAddDoc.mock.calls.filter(
        call => call[1] && call[1].name === 'Test Restaurant'
      );
      expect(restaurantSaveCalls).toHaveLength(0);
    });
  });

  describe('addRating', () => {
    beforeEach(() => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));
      mockUpdateDoc.mockResolvedValue({});
    });

    it('should successfully add a rating to a restaurant', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const currentRatings = [
        { userName: 'Alice', rating: 4, comment: 'Good', date: '2024-01-01' },
      ];

      const newRatingData = {
        userName: 'Bob',
        rating: '5',
        comment: 'Excellent!',
      };

      let success;
      await act(async () => {
        success = await result.current.addRating('resto-1', currentRatings, newRatingData);
      });

      expect(success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should reject rating without user name', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const newRatingData = {
        userName: '', // Missing
        rating: '5',
        comment: 'Great!',
      };

      let success;
      await act(async () => {
        success = await result.current.addRating('resto-1', [], newRatingData);
      });

      expect(success).toBe(false);
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should reject rating without rating value', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const newRatingData = {
        userName: 'Bob',
        rating: '', // Missing
        comment: 'Great!',
      };

      let success;
      await act(async () => {
        success = await result.current.addRating('resto-1', [], newRatingData);
      });

      expect(success).toBe(false);
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should reject invalid rating value', async () => {
      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      const newRatingData = {
        userName: 'Bob',
        rating: '0', // Invalid (< 1)
        comment: 'Great!',
      };

      let success;
      await act(async () => {
        success = await result.current.addRating('resto-1', [], newRatingData);
      });

      expect(success).toBe(false);
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('should allow clearing error with setError', async () => {
      mockGetDocs.mockResolvedValueOnce(createMockQuerySnapshot([]));

      const { result } = renderHook(() => useRestaurants());

      await waitFor(() => {
        expect(result.current.restos).toBeDefined();
      });

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });
});
