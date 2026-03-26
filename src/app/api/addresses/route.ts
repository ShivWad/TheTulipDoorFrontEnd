/**
 * User Addresses API
 * 
 * CRUD operations for user delivery addresses.
 * All endpoints require authentication.
 * 
 * Endpoints:
 * - GET /api/addresses - List user's addresses
 * - POST /api/addresses - Create new address
 * - PUT /api/addresses - Update existing address
 * - DELETE /api/addresses?id={id} - Delete address
 * 
 * Request Body (POST/PUT):
 * - type: 'home' | 'work' | 'other' (optional)
 * - fullName: Full name for delivery (optional)
 * - address: Street address (required)
 * - city: City name (required)
 * - state: State name (required)
 * - pincode: Postal code (required)
 * - phone: Phone number (optional, E.164 format)
 * - isDefault: Set as default address (optional)
 * 
 * Responses:
 * - 200: Success (GET/PUT/DELETE)
 * - 201: Created (POST)
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Address not found
 * - 500: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';

/**
 * Zod schema for address validation
 */
const addressSchema = z.object({
  type: z.enum(['home', 'work', 'other']).optional(),
  fullName: z.string().max(100).optional(),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().min(1, 'Pincode is required').max(20),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  isDefault: z.boolean().optional(),
});

/**
 * GET /api/addresses
 * 
 * Fetch all addresses for the authenticated user.
 * Returns addresses sorted by isDefault (default first).
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

    // Fetch addresses for user
    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    logger.error({ message: 'Get addresses error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/addresses
 * 
 * Create a new delivery address for the user.
 * If isDefault is true, unsets other default addresses.
 */
export async function POST(request: NextRequest) {
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
    
    const validation = addressSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { type, fullName, address, city, state, pincode, phone, isDefault } = validation.data;

    // Use transaction to ensure atomicity when setting default
    const newAddress = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: session.user.id,
          type: type || 'home',
          fullName,
          address,
          city,
          state,
          pincode,
          phone,
          isDefault: isDefault || false,
        },
      });
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    logger.error({ message: 'Create address error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/addresses
 * 
 * Update an existing address.
 * Only the address owner can update their addresses.
 * 
 * Request Body:
 * - id: Address ID (required)
 * - ...address fields to update
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

    // Parse request body
    const body = await request.json();
    const { id, ...addressData } = body;
    
    // Validate address data (exclude id)
    const validation = addressSchema.safeParse(addressData);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { type, fullName, address, city, state, pincode, phone, isDefault } = validation.data;

    // Verify address belongs to user
    const existingAddress = await db.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure atomicity when setting default
    const updatedAddress = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          type: type || existingAddress.type,
          fullName,
          address,
          city,
          state,
          pincode,
          phone,
          isDefault: isDefault ?? existingAddress.isDefault,
        },
      });
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    logger.error({ message: 'Update address error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/addresses?id={id}
 * 
 * Delete an address by ID.
 * Only the address owner can delete their addresses.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get address ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID required' },
        { status: 400 }
      );
    }

    // Verify address belongs to user
    const existingAddress = await db.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Delete address
    await db.address.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    logger.error({ message: 'Delete address error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
