import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 既存データを削除
  await prisma.person.deleteMany();

  // 新しいデータを挿入
  await prisma.person.createMany({
    data: [{ name: '織田信長' }, { name: '豊臣秀吉' }, { name: '徳川家康' }],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
