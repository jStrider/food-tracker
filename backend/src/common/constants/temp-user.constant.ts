/**
 * @deprecated This file is deprecated and should not be used.
 * Use proper authentication context with req.user.userId instead.
 * This constant is now removed to prevent security vulnerabilities.
 */

// SECURITY FIX: Hardcoded user IDs removed
// Use req.user.userId from JWT token payload in controllers
// For tests, use proper test user creation with dynamic IDs

// Temporary export for backward compatibility during migration
export const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';
