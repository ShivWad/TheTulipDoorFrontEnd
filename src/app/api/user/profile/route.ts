/**
 * User Profile API
 * 
 * Endpoints for authenticated users to view and update their profile.
 * 
 * Endpoints:
 * - GET /api/user/profile - Get current user's profile
 * - PUT /api/user/profile - Update profile (name, phone, password)
 * 
 * Request Body (PUT):
 * - name: User's name (optional)
 * - phone: Phone number (optional, E.164 format)
 * - currentPassword: Required if changing password
 * - newPassword: New password (optional, min 6 chars)
 * 
 * Responses:
 * - 200: Success
 * - 400: Validation error / incorrect password
 * - 401: Unauthorized
 * - 404: User not found
 * - 500: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import logger from '@/lib/logger';

/**
 * Zod schema for profile update validation
 */
const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

/**
 * GET /api/user/profile
 * 
 * Get the current user's profile information.
 * Returns: id, email, name, phone, createdAt
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile (excluding sensitive data)
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error({ message: 'Get profile error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * 
 * Update the current user's profile.
 * Can update name, phone, and optionally change password.
 * 
 * Password change requires current password verification.
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, phone, currentPassword, newPassword } = validation.data;

    // Fetch current user data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password required to set new password' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.user.update({
        where: { id: session.user.id },
        data: {
          name,
          phone,
          password: hashedPassword,
        },
      });
    } else {
      // Update without password change
      await db.user.update({
        where: { id: session.user.id },
        data: {
          name,
          phone,
        },
      });
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    logger.error({ message: 'Update profile error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
