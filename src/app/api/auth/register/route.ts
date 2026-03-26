/**
 * User Registration API
 * 
 * POST /api/auth/register
 * 
 * Creates a new user account with email and password.
 * 
 * Request Body:
 * - email: User's email address (required, unique)
 * - password: User's password (required, min 6 chars)
 * - name: User's name (optional)
 * - phone: Phone number (optional, E.164 format)
 * 
 * Security:
 * - Rate limited: 5 requests per 15 minutes per IP
 * - Password hashed with bcrypt (cost factor 12)
 * - Input validation with Zod
 * 
 * Responses:
 * - 201: User created successfully
 * - 400: Validation error or user already exists
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import logger from '@/lib/logger';

/**
 * Zod schema for user registration validation
 * Ensures email format, password length, and optional field constraints
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
});

/**
 * Handle user registration
 * 
 * Flow:
 * 1. Check rate limit
 * 2. Validate request body
 * 3. Check if email already exists
 * 4. Hash password and create user
 * 5. Return success response
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - get client IP and check limit
    const ip = getClientIp(request);
    const { success, remaining } = rateLimit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { email, password, name, phone } = validation.data;

    // 3. Check if user with email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // 4. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
      },
    });

    // 5. Return success
    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    // Log error for debugging
    logger.error({ message: 'Registration failed', error: (error as Error).message, stack: (error as Error).stack });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
