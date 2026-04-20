import { Router } from 'express';
import { login, register } from '../controllers/auth';
import { getTickets, createTicket, updateTicket, deleteTicket } from '../controllers/tickets';
import { upload } from '../middleware/upload';
import { getUsers, updateUser, deleteUser, toggleUserStatus } from '../controllers/admin';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { getAnalytics } from '../controllers/analytics';
import { getSettings, updateSettings, uploadLogo } from '../controllers/settings';

const router = Router();

// Auth routes
router.post('/auth/login', login);

// Ticket routes (Protected)
router.get('/tickets', authenticateToken, getTickets);
router.post('/tickets', authenticateToken, upload.array('files', 3), createTicket);
router.put('/tickets/:id', authenticateToken, upload.array('files', 3), updateTicket);
router.delete('/tickets/:id', authenticateToken, deleteTicket);

// Category routes (Protected)
router.get('/categories', authenticateToken, getCategories);
router.post('/categories', authenticateToken, isAdmin, createCategory);
router.put('/categories/:id', authenticateToken, isAdmin, updateCategory);
router.delete('/categories/:id', authenticateToken, isAdmin, deleteCategory);

// Admin routes (Protected + Admin only)
router.get('/admin/users', authenticateToken, isAdmin, getUsers);
router.post('/admin/users', authenticateToken, isAdmin, register);
router.put('/admin/users/:id', authenticateToken, isAdmin, updateUser);
router.delete('/admin/users/:id', authenticateToken, isAdmin, deleteUser);
router.patch('/admin/users/:id/toggle', authenticateToken, isAdmin, toggleUserStatus);

// Analytics & Settings
router.get('/analytics', authenticateToken, getAnalytics);
router.get('/settings', authenticateToken, getSettings);
router.put('/settings', authenticateToken, isAdmin, updateSettings);
router.post('/settings/logo', authenticateToken, isAdmin, upload.single('logo'), uploadLogo);

export default router;
