import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    // Use test environment variables to prevent accidental production DB access
    env: {
      VITE_FIREBASE_API_KEY: 'fake-test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'fake-test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'fake-test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'fake-test-bucket',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:fake-app-id',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.js',
        '**/firebase.js', // Skip Firebase config in coverage
      ],
    },
  },
});
