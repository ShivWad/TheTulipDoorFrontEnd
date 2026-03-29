/**
 * Authentication Configuration
 * 
 * NextAuth.js (v5) configuration for user authentication.
 * Uses credentials-based login with email/password authentication.
 * 
 * Features:
 * - JWT-based sessions (30 days)
 * - Secure cookie settings (httpOnly, secure, sameSite)
 * - Custom sign-in page at /login
 * - Password hashing with bcrypt
 * 
 * Environment Variables:
 * - AUTH_SECRET: Secret key for JWT signing
 * 
 * @see https://next-auth.js.org/
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * NextAuth.js configuration
 * Exports handlers, signIn, signOut, and auth functions
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Authentication providers
  providers: [
    /**
     * Credentials provider for email/password login
     * Validates user credentials against database
     */
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * Authorize user with email and password
       * 1. Find user by email in database
       * 2. Compare password hash using bcrypt
       * 3. Return user object if valid, null otherwise
       */
      async authorize(credentials) {
        // Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // Return user data (excludes password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  
  // Callbacks for JWT and session customization
  callbacks: {
    /**
     * JWT callback - adds user ID, isAdmin, and phone to token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.phone = (user as any).phone;
      }
      return token;
    },
    /**
     * Session callback - adds user ID, isAdmin, and phone from token to session
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
        (session.user as any).phone = token.phone as string;
      }
      return session;
    },
  },
  
  // Custom pages
  pages: {
    signIn: '/login',
  },
  
  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  
  // Auth secret from environment
  secret: process.env.AUTH_SECRET,
  
  // Cookie configuration
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,           // Prevents JavaScript access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',          // CSRF protection
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
});
