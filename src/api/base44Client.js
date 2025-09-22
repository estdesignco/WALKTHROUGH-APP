import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68aa190405831b9c5f196f58", 
  requiresAuth: true // Ensure authentication is required for all operations
});
