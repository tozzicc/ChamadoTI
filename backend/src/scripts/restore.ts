import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function runRestore() {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    const latestBackupPath = path.join(backupDir, 'backup_latest_before_demo.json');

    if (!fs.existsSync(latestBackupPath)) {
      console.error(`Arquivo de backup não encontrado em: ${latestBackupPath}`);
      process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(latestBackupPath, 'utf-8'));
    console.log('Restaurando backup de:', backupData.createdAt);

    // Delete in reverse relation order
    await prisma.attachment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.settings.deleteMany();

    // Restore Settings
    for (const s of backupData.data.settings) {
      await prisma.settings.create({
        data: {
          id: s.id,
          appName: s.appName,
          logoPath: s.logoPath,
          smtpHost: s.smtpHost,
          smtpPort: s.smtpPort,
          smtpUser: s.smtpUser,
          smtpPass: s.smtpPass,
          smtpSecure: s.smtpSecure,
          visibleCharts: s.visibleCharts,
          defaultChartType: s.defaultChartType
        }
      });
    }

    // Restore Categories
    const categoryMap = new Map<number, number>();
    for (const c of backupData.data.categories) {
      const created = await prisma.category.create({
        data: {
          name: c.name,
          description: c.description,
          createdAt: new Date(c.createdAt)
        }
      });
      categoryMap.set(c.id, created.id);
    }

    // Restore Users
    const userMap = new Map<number, number>();
    for (const u of backupData.data.users) {
      const specialtyConnect = (u.specialties || []).map((s: any) => ({
        id: categoryMap.get(s.id) || s.id
      })).filter((s: any) => s.id);

      const created = await prisma.user.create({
        data: {
          name: u.name,
          username: u.username,
          password: u.password,
          role: u.role,
          email: u.email,
          isActive: u.isActive,
          createdAt: new Date(u.createdAt),
          specialties: specialtyConnect.length > 0 ? {
            connect: specialtyConnect
          } : undefined
        }
      });
      userMap.set(u.id, created.id);
    }

    // Restore Tickets
    for (const t of backupData.data.tickets) {
      const newAuthorId = userMap.get(t.authorId) || t.authorId;
      const newCategoryId = categoryMap.get(t.categoryId) || t.categoryId;
      const newAssignedToId = t.assignedToId ? (userMap.get(t.assignedToId) || t.assignedToId) : null;

      const createdTicket = await prisma.ticket.create({
        data: {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          categoryId: newCategoryId,
          authorId: newAuthorId,
          assignedToId: newAssignedToId,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          closedAt: t.closedAt ? new Date(t.closedAt) : null,
          attachments: {
            create: (t.attachments || []).map((att: any) => ({
              filename: att.filename,
              path: att.path,
              mimetype: att.mimetype,
              size: att.size,
              createdAt: new Date(att.createdAt)
            }))
          }
        }
      });
    }

    console.log('--- RESTAURAÇÃO CONCLUÍDA COM SUCESSO ---');

  } catch (error) {
    console.error('Erro na restauração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRestore();
