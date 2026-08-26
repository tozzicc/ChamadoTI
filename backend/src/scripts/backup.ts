import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function runBackup() {
  try {
    console.log('Iniciando conexão com o banco de dados...');
    await prisma.$connect();
    console.log('Conectado com sucesso!');
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupDir, `backup_${timestamp}.json`);

    const users = await prisma.user.findMany({
      include: { specialties: true }
    });
    const categories = await prisma.category.findMany();
    const tickets = await prisma.ticket.findMany({
      include: { attachments: true }
    });
    const settings = await prisma.settings.findMany();
    const attachments = await prisma.attachment.findMany();

    const backupData = {
      createdAt: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL?.split('@')[1] || 'PostgreSQL',
      counts: {
        users: users.length,
        categories: categories.length,
        tickets: tickets.length,
        settings: settings.length,
        attachments: attachments.length
      },
      data: {
        users,
        categories,
        tickets,
        settings,
        attachments
      }
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

    // Also write a standard latest backup file
    const latestBackupPath = path.join(backupDir, 'backup_latest_before_demo.json');
    fs.writeFileSync(latestBackupPath, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log('--- BACKUP CONCLUÍDO COM SUCESSO ---');
    console.log(`Arquivo 1: ${backupFilePath}`);
    console.log(`Arquivo 2: ${latestBackupPath}`);
    console.log('Resumo dos dados atuais no banco:');
    console.log(JSON.stringify(backupData.counts, null, 2));
    console.log('\nUsuários encontrados:');
    users.forEach(u => console.log(`- ID: ${u.id}, Nome: ${u.name}, Usuário: ${u.username}, Role: ${u.role}, Email: ${u.email}`));
    console.log('\nCategorias encontradas:');
    categories.forEach(c => console.log(`- ID: ${c.id}, Nome: ${c.name}`));
    console.log('\nChamados encontrados:');
    tickets.forEach(t => console.log(`- ID: ${t.id}, Título: "${t.title}", Status: ${t.status}, Prioridade: ${t.priority}`));

  } catch (error) {
    console.error('Erro ao realizar backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
