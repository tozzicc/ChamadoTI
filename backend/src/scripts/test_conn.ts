import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function test() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected successfully!');
    const count = await prisma.user.count();
    console.log('User count:', count);
  } catch (err: any) {
    console.error('Connection error detail:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
