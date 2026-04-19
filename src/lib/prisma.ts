import { PrismaClient } from '@prisma/client';

// Singleton: reuse one connection across all repository instances and tests.
// Prevents "too many connections" and ensures clean teardown with $disconnect().
const prisma = new PrismaClient();

export default prisma;
