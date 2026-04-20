import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendEmail } from '../lib/emailService';

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id: userId } = req.user!;
    let tickets;

    const commonInclude = { 
      author: { select: { name: true, username: true, email: true } }, 
      assignedTo: { select: { name: true } },
      category: true,
      attachments: true
    };

    if (role === 'ADMIN') {
      tickets = await prisma.ticket.findMany({
        include: commonInclude,
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'TECHNICIAN') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { specialties: true }
      });
      const specialtyIds = user?.specialties.map(s => s.id) || [];
      
      tickets = await prisma.ticket.findMany({
        where: { 
          OR: [
            { categoryId: { in: specialtyIds } },
            { assignedToId: userId }
          ]
        },
        include: commonInclude,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      tickets = await prisma.ticket.findMany({
        where: { authorId: userId },
        include: commonInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar chamados' });
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  const { title, description, priority, categoryId } = req.body;
  const userId = req.user!.id;
  const files = req.files as Express.Multer.File[];

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        authorId: userId,
        categoryId: parseInt(categoryId),
        attachments: {
          create: files?.map(file => ({
            filename: file.originalname,
            path: file.filename,
            mimetype: file.mimetype,
            size: file.size
          }))
        }
      },
      include: { author: true, attachments: true }
    });

    if (ticket.author.email) {
      await sendEmail(
        ticket.author.email,
        `Chamado Criado: #${ticket.id} - ${ticket.title}`,
        `<p>Olá ${ticket.author.name},</p><p>Seu chamado <strong>#${ticket.id}</strong> foi criado com sucesso.</p>`
      );
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar chamado' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, assignedToId, priority, title, description, categoryId, removeAttachments } = req.body;
  const { id: userId, role } = req.user!;
  const files = req.files as Express.Multer.File[];

  try {
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: { author: true, attachments: true }
    });

    if (!oldTicket) return res.status(404).json({ message: 'Chamado não encontrado' });

    const isAuthor = oldTicket.authorId === userId;
    const isStaff = role === 'ADMIN' || role === 'TECHNICIAN';

    if (!isAuthor && !isStaff) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    if (isAuthor && !isStaff && oldTicket.status !== 'OPEN') {
      return res.status(403).json({ message: 'Chamado em atendimento não pode ser editado' });
    }

    // Handle removal of attachments
    if (removeAttachments) {
      try {
        const idsToRemove = JSON.parse(removeAttachments).map((id: string) => parseInt(id));
        await prisma.attachment.deleteMany({
          where: { id: { in: idsToRemove }, ticketId: parseInt(id) }
        });
      } catch (e) {
        console.error('Falha ao processar removeAttachments', e);
      }
    }

    const isClosing = isStaff && status === 'CLOSED' && oldTicket.status !== 'CLOSED';
    const isReopening = isStaff && status && status !== 'CLOSED' && oldTicket.status === 'CLOSED';

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: isStaff ? (status || undefined) : undefined,
        priority: priority || undefined,
        assignedToId: isStaff && assignedToId ? parseInt(assignedToId) : undefined,
        title: isAuthor || role === 'ADMIN' ? (title || undefined) : undefined,
        description: isAuthor || role === 'ADMIN' ? (description || undefined) : undefined,
        categoryId: (isAuthor || role === 'ADMIN') && categoryId ? parseInt(categoryId) : undefined,
        closedAt: isClosing ? new Date() : (isReopening ? null : undefined),
        attachments: {
          create: files?.map(file => ({
            filename: file.originalname,
            path: file.filename,
            mimetype: file.mimetype,
            size: file.size
          }))
        }
      },
      include: { author: true, assignedTo: true, category: true, attachments: true }
    });

    if (status && status !== oldTicket.status && ticket.author.email) {
      await sendEmail(ticket.author.email, `Atualização: #${ticket.id}`, `<p>Status alterado para: ${status}</p>`);
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar' });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { id: userId, role } = req.user!;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado' });

    // Authorization: Only Author or Admin can delete
    const isAuthor = ticket.authorId === userId;
    if (!isAuthor && role !== 'ADMIN') {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este chamado' });
    }

    // Restriction: Only delete if OPEN
    if (ticket.status !== 'OPEN' && role !== 'ADMIN') {
      return res.status(403).json({ message: 'Não é possível excluir um chamado que já está em atendimento' });
    }

    await prisma.ticket.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Chamado excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir chamado' });
  }
};
