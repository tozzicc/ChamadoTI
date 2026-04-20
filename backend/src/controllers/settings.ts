import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1 }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar configurações' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { appName, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, visibleCharts, defaultChartType } = req.body;
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        appName,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
        smtpUser,
        smtpPass,
        smtpSecure: smtpSecure === 'true' || smtpSecure === true,
        visibleCharts,
        defaultChartType
      },
      create: {
        id: 1,
        appName: appName || "Chamado TI",
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
        smtpUser,
        smtpPass,
        smtpSecure: smtpSecure === 'true' || smtpSecure === true,
        visibleCharts,
        defaultChartType
      }
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar configurações' });
  }
};

export const uploadLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { logoPath: req.file.filename },
      create: { id: 1, logoPath: req.file.filename }
    });

    res.json({ message: 'Logo atualizada com sucesso', settings });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao enviar logo' });
  }
};
