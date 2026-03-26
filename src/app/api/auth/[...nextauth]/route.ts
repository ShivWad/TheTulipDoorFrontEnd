/**
 * NextAuth.js Route Handler
 * 
 * GET/POST /api/auth/[...nextauth]
 * 
 * Catches all NextAuth.js routes and delegates to the auth handlers.
 * This includes:
 * - GET /api/auth/signin - Sign-in page
 * - POST /api/auth/callback/credentials - Credential login callback
 * - GET /api/auth/signout - Sign out
 * - GET /api/auth/session - Get session info
 * - etc.
 * 
 * @see https://next-auth.js.org/docs/getting-started
 */

import { handlers } from '@/lib/auth';

/**
 * Export GET and POST handlers from NextAuth.js
 * These handle all authentication routes
 */
export const { GET, POST } = handlers;
