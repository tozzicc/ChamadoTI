import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id: userId } = req.user!;
    let tickets;

    if (role === 'ADMIN') {
      // Admin sees everything
      tickets = await prisma.ticket.findMany({
        include: { author: { select: { name: true, username: true } }, assignedTo: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Regular user sees their own tickets
      tickets = await prisma.ticket.findMany({
        where: { authorId: userId },
        include: { author: { select: { name: true } }, assignedTo: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tickets' });
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  const { title, description, priority } = req.body;
  const userId = req.user!.id;

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        authorId: userId,
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating ticket' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, assignedToId, priority } = req.body;

  try {
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: status || undefined,
        priority: priority || undefined,
        assignedToId: assignedToId ? parseInt(assignedToId) : undefined,
      },
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating ticket' });
  }
};
