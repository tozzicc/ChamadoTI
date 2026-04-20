import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId, role } = req.user!;
    const settings = await prisma.settings.findFirst();

    // Filtering base for Technician (only tickets they are involved with or can see)
    // Actually, user requested "graph according to his user". 
    // For Top Authors, Category freq, etc., if Technician, show stats for their assigned/specialty tickets.
    
    let techFilter = {};
    if (role === 'TECHNICIAN') {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { specialties: true } });
      const specialtyIds = user?.specialties.map(s => s.id) || [];
      techFilter = {
        OR: [
          { categoryId: { in: specialtyIds } },
          { assignedToId: userId }
        ]
      };
    }

    // 1. Top Authors (within visibility)
    const topAuthorsQuery = await prisma.ticket.groupBy({
      by: ['authorId'],
      where: techFilter,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topUserOpen = await Promise.all(topAuthorsQuery.map(async (item) => {
      const user = await prisma.user.findUnique({ where: { id: item.authorId }, select: { name: true, username: true } });
      return { 
        username: user?.name || user?.username || 'Desconhecido', 
        _count: { id: item._count.id } 
      };
    }));

    // 2. Top Technicians (by closed tickets within visibility)
    const topTechsQuery = await prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: { 
        ...techFilter,
        status: 'CLOSED',
        assignedToId: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topTechResolve = await Promise.all(topTechsQuery.map(async (item) => {
      const user = await prisma.user.findUnique({ where: { id: item.assignedToId! }, select: { name: true } });
      return { techName: user?.name || 'Desconhecido', count: item._count.id };
    }));

    // 3. Category Frequency
    const categoryQuery = await prisma.ticket.groupBy({
      by: ['categoryId'],
      where: techFilter,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const categoryFreq = await Promise.all(categoryQuery.map(async (item) => {
      const cat = await prisma.category.findUnique({ where: { id: item.categoryId }, select: { name: true } });
      return { category: cat?.name || 'Geral', count: item._count.id };
    }));

    // 4. Resolution Time
    const closedTickets = await prisma.ticket.findMany({
      where: { 
        ...techFilter,
        status: 'CLOSED',
        closedAt: { not: null },
      },
      select: { createdAt: true, closedAt: true }
    });

    let avgResolutionTime = 0;
    if (closedTickets.length > 0) {
      const totalTime = closedTickets.reduce((acc, t) => {
        const diff = t.closedAt!.getTime() - t.createdAt.getTime();
        return acc + diff;
      }, 0);
      avgResolutionTime = (totalTime / closedTickets.length) / (1000 * 60 * 60);
    }

    // Role-based personalization (myStats)
    let myStats = null;
    if (role === 'TECHNICIAN') {
      const myClosed = await prisma.ticket.count({ where: { assignedToId: userId, status: 'CLOSED' } });
      const myInProg = await prisma.ticket.count({ where: { assignedToId: userId, status: 'IN_PROGRESS' } });
      myStats = { closed: myClosed, inProgress: myInProg };
    }

    res.json({
      topUserOpen,
      topTechResolve,
      categoryFreq,
      avgResolutionTime: parseFloat(avgResolutionTime.toFixed(2)),
      myStats,
      settings: {
        visibleCharts: settings?.visibleCharts ? JSON.parse(settings.visibleCharts) : ['user_open', 'tech_resolve', 'resolution_time', 'category_freq'],
        defaultChartType: settings?.defaultChartType || 'BAR'
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao gerar estatísticas' });
  }
};
