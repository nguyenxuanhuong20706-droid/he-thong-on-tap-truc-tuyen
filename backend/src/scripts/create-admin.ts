import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const usernameArg = args.find((a) => a.startsWith('--username='))?.split('=')[1] || process.env.ADMIN_USERNAME;
  const passwordArg = args.find((a) => a.startsWith('--password='))?.split('=')[1] || process.env.ADMIN_PASSWORD;

  if (!usernameArg || !passwordArg) {
    console.error('❌ Lỗi: Cần cung cấp username và password để tạo tài khoản ADMIN.');
    console.log('Cách dùng: npm run create:admin -- --username=<ten_dang_nhap> --password=<mat_khau>');
    process.exit(1);
  }

  const normalizedUsername = usernameArg.trim().toLowerCase();

  if (normalizedUsername.length < 3 || passwordArg.length < 6) {
    console.error('❌ Lỗi: Username tối thiểu 3 ký tự, Password tối thiểu 6 ký tự.');
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizedUsername,
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    if (existing.role === Role.ADMIN) {
      console.log(`ℹ️ Tài khoản ${normalizedUsername} đã tồn tại và đã là ADMIN.`);
      return;
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: Role.ADMIN },
    });
    console.log(`✅ Đã thăng cấp tài khoản ${normalizedUsername} thành ADMIN thành công!`);
    return;
  }

  const passwordHash = await argon2.hash(passwordArg, {
    type: argon2.argon2id,
  });

  const admin = await prisma.user.create({
    data: {
      username: normalizedUsername,
      passwordHash,
      role: Role.ADMIN,
      fullName: 'System Administrator',
    },
  });

  console.log(`✅ Khởi tạo tài khoản ADMIN thành công: ${admin.username} (ID: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi tạo admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

