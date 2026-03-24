import { Router } from 'express';
import { login, register } from '../controllers/auth';
import { getTickets, createTicket, updateTicket } from '../controllers/tickets';
import { getUsers } from '../controllers/admin';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/auth/login', login);

// Ticket routes (Protected)
router.get('/tickets', authenticateToken, getTickets);
router.post('/tickets', authenticateToken, createTicket);
router.put('/tickets/:id', authenticateToken, isAdmin, updateTicket);

// Admin routes (Protected + Admin only)
router.get('/admin/users', authenticateToken, isAdmin, getUsers);
router.post('/admin/users', authenticateToken, isAdmin, register);

export default router;
