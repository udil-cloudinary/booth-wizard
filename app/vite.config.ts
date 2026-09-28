import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// MOCK_UPLOAD=1 is an alias for VITE_MOCK_UPLOAD=true.
if (process.env.MOCK_UPLOAD === '1') process.env.VITE_MOCK_UPLOAD = 'true';

// HTTPS in dev so the phone camera opens over the LAN. Relative base so dist/
// works from any host or sub-path (Cloudflare Pages, S3 + CloudFront, Vercel).
export default defineConfig(({ command }) => ({
  base: './',
  plugins: command === 'serve' ? [basicSsl()] : [],
  server: { host: true },
  build: { target: 'es2020', assetsInlineLimit: 0 },
}));
