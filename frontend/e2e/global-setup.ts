import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

async function globalSetup(config: FullConfig) {
  // Create auth directory if it doesn't exist
  const authDir = path.join(__dirname, '../.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Launch browser for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Check if auth file already exists
    const authFile = path.join(authDir, 'user.json');
    if (fs.existsSync(authFile)) {
      console.log('💾 Using existing authentication state from .auth/user.json');
      await browser.close();
      return;
    }

    console.log('🔐 Setting up authentication for E2E tests...');
    
    // Check if backend is available
    try {
      const response = await page.goto('http://localhost:3001/api/health', { 
        timeout: 5000,
        waitUntil: 'domcontentloaded' 
      });
      if (!response || !response.ok()) {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.warn('⚠️  Backend not available, using mock authentication for development');
      // Create mock auth state for development
      const mockAuthState = {
        cookies: [
          {
            name: "token",
            value: "mock-jwt-token",
            domain: "localhost",
            path: "/",
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: "Lax"
          }
        ],
        origins: [
          {
            origin: "http://localhost:3000",
            localStorage: [
              {
                name: "token",
                value: "mock-jwt-token"
              }
            ]
          }
        ]
      };
      fs.writeFileSync(authFile, JSON.stringify(mockAuthState, null, 2));
      console.log('💾 Mock authentication state saved to .auth/user.json');
      await browser.close();
      return;
    }
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    
    // Wait for login form to be ready
    await page.waitForSelector('#email', { state: 'visible', timeout: 30000 });
    
    // Fill login form with test credentials
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for successful login - should redirect to home page
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Ensure the navigation is visible (indicates successful login)
    await page.waitForSelector('nav', { state: 'visible', timeout: 5000 });
    
    console.log('✅ Authentication successful!');
    
    // Save authentication state (cookies, localStorage, etc.)
    const storageState = await context.storageState();
    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
    
    console.log('💾 Authentication state saved to .auth/user.json');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;