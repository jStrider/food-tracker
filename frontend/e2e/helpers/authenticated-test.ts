import { test as base } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend base test with authenticated context
export const test = base.extend({
  // Override the default context to use saved authentication state
  context: async ({ browser }, use) => {
    const authFile = path.join(__dirname, '../../.auth/user.json');
    const context = await browser.newContext({ storageState: authFile });
    await use(context);
    await context.close();
  },
  
  // Override the default page to use authenticated context
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';