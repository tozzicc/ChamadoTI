import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Clock, AlertCircle } from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  author: { name: string; username?: string };
  assignedTo?: { name: string } | null;
  createdAt: string;
}

const Dashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
    } catch (error) {
      console.error('Failed to update ticket', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="badge badge-open">Aberto</span>;
      case 'IN_PROGRESS': return <span className="badge badge-progress">Em Andamento</span>;
      case 'CLOSED': return <span className="badge badge-closed">Fechado</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW': return <span className="badge badge-low">Baixa</span>;
      case 'MEDIUM': return <span className="badge badge-medium">Média</span>;
      case 'HIGH': return <span className="badge badge-high">Alta</span>;
      default: return null;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando chamados...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Chamados</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {user?.role === 'ADMIN' ? 'Gerencie todos os chamados da equipe.' : 'Acompanhe seus chamados abertos.'}
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>Nenhum chamado encontrado</h3>
          <p>Você não possui chamados no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map((ticket, index) => (
            <motion.div 
              key={ticket.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel" 
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{ticket.title}</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <span>Por: {ticket.author.name}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} />
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {ticket.assignedTo && (
                      <>
                        <span>•</span>
                        <span>Atribuído a: {ticket.assignedTo.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {ticket.description}
              </div>
              
              {user?.role === 'ADMIN' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                  <select 
                    className="select-field" 
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                  >
                    <option value="OPEN">Marcar como Aberto</option>
                    <option value="IN_PROGRESS">Marcar Em Andamento</option>
                    <option value="CLOSED">Marcar como Fechado</option>
                  </select>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
