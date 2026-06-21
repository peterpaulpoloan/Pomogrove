import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  webServer: {
    command: 'npm run dev',
    url: 'https://pomogrove-beta.vercel.app',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'https://pomogrove-beta.vercel.app',
  },
});