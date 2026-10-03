const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'lgtvk84@gmail.com';
  const plainPassword = 'Krishna,0007';

  console.log(`Hashing password and creating/updating admin account for ${email}...`);

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      isVerified: true,
      status: 'ACTIVE',
    },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      isVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Admin account created successfully!`);
  console.log(`ID: ${admin.id}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
  console.log(`Status: ${admin.status}`);
}

createAdmin()
  .catch((err) => {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
