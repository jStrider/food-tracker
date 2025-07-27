import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Note: Token handling is managed by the AuthContext interceptors
// This ensures consistency across the application
// The AuthContext sets up global axios interceptors that:
// 1. Add the access token to all requests
// 2. Handle 401 errors by refreshing the token
// 3. Retry failed requests after token refresh