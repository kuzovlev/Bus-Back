const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSetting(keyName) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { keyName },
      select: {
        value: true,
      },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching setting ${keyName}:`, error);
    return null;
  }
}

module.exports = {
  getSetting,
}; 