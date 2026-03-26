/**
 * Database Client
 * 
 * Provides a singleton Prisma Client instance for database operations.
 * Prisma is used as the ORM (Object-Relational Mapping) layer to interact
 * with the PostgreSQL database.
 * 
 * The singleton pattern ensures we don't create multiple connections
 * during development hot-reloading.
 * 
 * @see https://www.prisma.io/docs
 */

import { PrismaClient } from '@prisma/client';

/**
 * Global type augmentation to hold the Prisma client instance
 * This prevents multiple PrismaClient instances in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Database client instance
 * Uses existing global instance if available, otherwise creates new one
 */
export const db = globalForPrisma.prisma ?? new PrismaClient();

// In development, persist the client instance across hot-reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
