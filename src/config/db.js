const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('🚀 Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

module.exports = { prisma, connectDB }; 