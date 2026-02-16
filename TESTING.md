# Testing Guide for Pixel Resto

This document explains the testing setup and how to run tests before pushing and deploying your app.

## 📦 Test Setup

Your app now has a comprehensive test suite organized in the `tests/` folder:
- **Unit tests** for utility functions ([tests/unit/helpers.test.js](tests/unit/helpers.test.js))
- **Component tests** for React components ([tests/components/ErrorToast.test.jsx](tests/components/ErrorToast.test.jsx))
- **Hook tests** for business logic ([tests/hooks/useRestaurants.test.js](tests/hooks/useRestaurants.test.js))

All test files are in the [tests/](tests/) directory - see [tests/README.md](tests/README.md) for details.

### Testing Stack
- **Vitest** - Fast, Vite-native test runner
- **React Testing Library** - Component testing utilities
- **jsdom** - DOM simulation for Node environment

## 🚀 Running Tests

### Run all tests once (before pushing)
```bash
npm test
```

### Run tests in watch mode (during development)
```bash
npm test -- --watch
```

### Run tests with UI (visual test runner)
```bash
npm test:ui
```

### Run tests with coverage report
```bash
npm test:coverage
```

## ✅ What Gets Tested

### 1. Utility Functions ([tests/unit/helpers.test.js](tests/unit/helpers.test.js)) - 22 tests
Tests all pure helper functions:
- ✓ **getPriceDisplay()** - Converts price levels to € symbols
- ✓ **extractCuisineType()** - Maps Google types to cuisine categories
- ✓ **calculateAverageRating()** - Calculates average from ratings
- ✓ **isValidRating()** - Validates rating values (1-5)

### 2. React Components ([tests/components/ErrorToast.test.jsx](tests/components/ErrorToast.test.jsx)) - 9 tests
Tests UI components:
- ✓ Renders error messages correctly
- ✓ Auto-dismisses after timeout
- ✓ Close button functionality
- ✓ Styling and positioning

### 3. Custom Hooks ([tests/hooks/useRestaurants.test.js](tests/hooks/useRestaurants.test.js)) - 14 tests
Tests business logic and data management:
- ✓ **refreshRestaurants()** - Fetches data from Firebase
- ✓ **saveRestaurant()** - Validates and saves new restaurants
  - Checks all required fields (halal, type, coords, rating)
  - Validates rating range (1-5)
  - Handles custom types
- ✓ **addRating()** - Adds ratings to existing restaurants
  - Validates user name and rating value
  - Appends to existing ratings
- ✓ Error handling and loading states

## 🔍 Test Coverage

The test suite covers:
- ✅ All validation rules
- ✅ Error handling
- ✅ Edge cases (null, empty, invalid values)
- ✅ Firebase operations (mocked)
- ✅ User interactions (clicks, auto-dismiss)
- ✅ Loading and error states

## 🛡️ What Tests Catch

These tests will catch:
- ❌ Validation bugs (missing fields, invalid ratings)
- ❌ Calculation errors (average rating formula)
- ❌ UI regressions (missing buttons, wrong styling)
- ❌ State management issues (loading states, errors)
- ❌ Type conversions (string to number for ratings)
- ❌ Null/undefined handling

## 📝 Before You Push Checklist

1. **Run tests**: `npm test`
2. **Check all tests pass** (look for "✓" green checkmarks)
3. **Fix any failures** before pushing
4. **Optionally check coverage**: `npm test:coverage`

## 🔧 Adding New Tests

### For a new helper function
Create tests in `tests/unit/`:
```javascript
// tests/unit/myHelper.test.js
import { myFunction } from '../../src/utils/myHelper';

describe('myNewFunction', () => {
  it('should do something', () => {
    expect(myNewFunction(input)).toBe(expectedOutput);
  });
});
```

### For a new component
Create test file in `tests/components/`:
```javascript
// tests/components/MyComponent.test.jsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../../src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### For hook modifications
Update or create tests in `tests/hooks/`.

## ⚙️ Configuration

- **Config file**: [vitest.config.js](vitest.config.js)
- **Setup file**: [tests/setup.js](tests/setup.js)
- **Mocks**: [tests/mocks/](tests/mocks/)
- **All tests**: [tests/](tests/) folder (organized by type)

## 🐛 Troubleshooting

### Tests fail with Firebase errors
- Tests use mocked Firebase - real Firebase connection means mocks aren't working
- Check that mocks are properly configured in test files

### Tests timeout
- Increase timeout in `vitest.config.js` if needed
- Check for infinite loops or missing mock responses

### Coverage seems low
- Run `npm test:coverage` to see detailed coverage report
- Focus on testing business logic and critical paths first

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Pro Tip**: Add `npm test` to your git pre-push hook to automatically run tests before pushing!
