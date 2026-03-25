import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';

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

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validation = addressSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { type, fullName, address, city, state, pincode, phone, isDefault } = validation.data;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await db.address.create({
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

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    logger.error({ message: 'Create address error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...addressData } = body;
    
    const validation = addressSchema.safeParse(addressData);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { type, fullName, address, city, state, pincode, phone, isDefault } = validation.data;

    const existingAddress = await db.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await db.address.update({
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

    return NextResponse.json(updatedAddress);
  } catch (error) {
    logger.error({ message: 'Update address error', error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID required' },
        { status: 400 }
      );
    }

    const existingAddress = await db.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

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
