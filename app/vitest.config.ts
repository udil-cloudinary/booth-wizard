import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // The app's real upload path, not the VITE_MOCK_UPLOAD fake; MSW answers it.
    env: { VITE_MOCK_UPLOAD: 'false', VITE_CLOUD_NAME: 'test-cloud' },
  },
});
