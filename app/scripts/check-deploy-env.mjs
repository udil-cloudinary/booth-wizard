// Runs before a deploy: refuse to ship a build that cannot upload to the booth cloud.
// Reads the env exactly as `vite build` will (.env, .env.production, .env.local, shell).
import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), 'VITE_');
const problems = [];
if (!env.VITE_CLOUD_NAME || env.VITE_CLOUD_NAME === 'your-booth-cloud') problems.push('VITE_CLOUD_NAME is not set to the booth cloud');
if (!env.VITE_UPLOAD_PRESET) problems.push('VITE_UPLOAD_PRESET is empty');
if (env.VITE_MOCK_UPLOAD === 'true' || env.VITE_MOCK_UPLOAD === '1' || process.env.MOCK_UPLOAD === '1') problems.push('mock upload is on');

if (problems.length) {
  console.error(`Not deploying: ${problems.join('; ')}. Fix app/.env (see .env.example).`);
  process.exit(1);
}
console.log(`Deploying for cloud "${env.VITE_CLOUD_NAME}", preset "${env.VITE_UPLOAD_PRESET}", ${env.VITE_META_MODE || 'metadata'} mode.`);
