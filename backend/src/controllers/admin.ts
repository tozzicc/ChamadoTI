import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, name: true, username: true, role: true, email: true, 
        isActive: true, createdAt: true, specialties: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
    const { name, email, role, password, specialties } = req.body;

    try {
      const updateData: any = {
        name,
        email,
        role,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (specialties && Array.isArray(specialties)) {
        updateData.specialties = {
          set: specialties.map((id: number) => ({ id }))
        };
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { specialties: true }
      });

    res.json({ message: 'User updated successfully', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      const field = target.includes('email') ? 'E-mail' : 'Nome de usuário';
      return res.status(400).json({ message: `${field} já está em uso.` });
    }
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: !user.isActive },
    });

    res.json({ message: `User ${updatedUser.isActive ? 'unblocked' : 'blocked'} successully`, isActive: updatedUser.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling user status' });
  }
};
