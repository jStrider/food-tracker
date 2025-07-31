import { apiClient } from './apiClient';

interface DefaultUser {
  id: string;
  email: string;
  name: string;
}

interface LoginResponse {
  access_token: string;
  user: DefaultUser;
}

/**
 * Initialize the app with a default user if not logged in
 * This ensures the user can use the app immediately without manual login
 */
export async function initializeApp(): Promise<boolean> {
  try {
    // Check if user already has a token
    const existingToken = localStorage.getItem('token');
    
    if (existingToken) {
      // Verify token is still valid by calling /auth/me
      try {
        await apiClient.get('/auth/me');
        return true; // User is already authenticated
      } catch (error: any) {
        // Token is invalid, remove it
        localStorage.removeItem('token');
      }
    }

    // No valid token, create default user and login
    console.log('No valid auth token found, initializing default user...');
    
    // Step 1: Initialize default user
    const initResponse = await apiClient.post('/users/init-default');
    const defaultUser = initResponse.data as DefaultUser;
    
    // Step 2: Login with default user
    const loginResponse = await apiClient.post<LoginResponse>('/auth/login', {
      email: defaultUser.email,
      password: 'default123' // Default password for development
    });
    
    // Step 3: Store token
    localStorage.setItem('token', loginResponse.data.access_token);
    
    console.log('Successfully initialized with default user:', defaultUser.email);
    return true;
    
  } catch (error: any) {
    console.error('Failed to initialize app:', error);
    
    // If initialization fails, try to provide helpful error message
    if (error?.response?.status === 404) {
      console.error('Backend API not reachable. Make sure backend is running on the correct port.');
      console.error('Expected port:', import.meta.env.VITE_API_URL);
    }
    
    return false;
  }
}

/**
 * Ensure user is authenticated before making API calls
 * Call this before any authenticated API operations
 */
export async function ensureAuthenticated(): Promise<boolean> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Try to initialize app with default user
    return await initializeApp();
  }
  
  // Verify token is still valid
  try {
    await apiClient.get('/auth/me');
    return true;
  } catch (error: any) {
    // Token is invalid, try to reinitialize
    localStorage.removeItem('token');
    return await initializeApp();
  }
}