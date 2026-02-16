# Tests Directory

This folder contains all tests for the Pixel Resto application.

## 📁 Structure

```
tests/
├── unit/              # Unit tests for utility functions
│   └── helpers.test.js
├── components/        # Component tests for React components
│   └── ErrorToast.test.jsx
├── hooks/             # Tests for custom React hooks
│   └── useRestaurants.test.js
├── mocks/             # Mock data and utilities
│   └── firebase.js
├── setup.js           # Test environment setup
└── README.md          # This file
```

## 🧪 Test Types

### Unit Tests (`unit/`)
Tests for pure utility functions that don't depend on React or external services.
- **helpers.test.js** - Tests for price display, cuisine extraction, rating calculations, and validation

### Component Tests (`components/`)
Tests for React components using React Testing Library.
- **ErrorToast.test.jsx** - Tests for error toast UI behavior, auto-dismiss, and user interactions

### Hook Tests (`hooks/`)
Tests for custom React hooks with mocked dependencies.
- **useRestaurants.test.js** - Tests for restaurant CRUD operations, validation, and error handling

## 🔧 Mocks (`mocks/`)

Contains mock implementations of external dependencies:
- **firebase.js** - Mock Firebase/Firestore functions for testing without hitting the real database

## ⚙️ Setup (`setup.js`)

Global test configuration including:
- React Testing Library cleanup
- jsdom environment setup
- Window API mocks

## 🚀 Running Tests

From the project root:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test:coverage

# Run tests with UI
npm test:ui
```

## ✍️ Writing New Tests

### For utility functions
Add tests to `unit/` folder:
```javascript
// tests/unit/myUtil.test.js
import { myFunction } from '../../src/utils/myUtil';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expectedOutput);
  });
});
```

### For components
Add tests to `components/` folder:
```javascript
// tests/components/MyComponent.test.jsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../../src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

### For hooks
Add tests to `hooks/` folder:
```javascript
// tests/hooks/useMyHook.test.js
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../../src/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });
});
```

## 📊 Current Coverage

- ✅ 45 tests passing
- ✅ All core utility functions tested
- ✅ All validation rules covered
- ✅ Critical UI components tested
- ✅ Business logic (hooks) thoroughly tested

## 🔍 What's NOT Tested (Yet)

These could be added in the future:
- Map components (complex due to Leaflet dependencies)
- Modal components (could add user interaction tests)
- Integration tests (testing multiple components together)
- E2E tests (full user flows with Playwright/Cypress)

## 📝 Best Practices

1. **Keep tests focused** - One assertion per test when possible
2. **Use descriptive names** - Test names should explain what they test
3. **Test behavior, not implementation** - Focus on what the code does, not how
4. **Mock external dependencies** - Don't hit real databases or APIs
5. **Keep tests fast** - Tests should run in milliseconds

## 🐛 Debugging Tests

If a test fails:
1. Read the error message carefully
2. Check if the test expectation is correct
3. Use `console.log()` to inspect values
4. Run just that test: `npm test -- -t "test name"`
5. Use the UI: `npm test:ui` for visual debugging

---

For more details, see [TESTING.md](../TESTING.md) in the project root.
