import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Clock, AlertCircle, Pencil, Trash2, Image as ImageIcon, FileText, BarChart3, Users as UsersIcon, CheckCircle2, Timer } from 'lucide-react';
import DashboardChart from '../components/DashboardChart';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: { id: number; name: string };
  author: { name: string; username?: string };
  authorId: number;
  assignedTo?: { name: string } | null;
  attachments?: { id: number; filename: string; path: string; mimetype: string }[];
  createdAt: string;
}

interface Analytics {
  topUserOpen: any[];
  topTechResolve: any[];
  categoryFreq: any[];
  avgResolutionTime: number;
}

const Dashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [ticketsRes, analyticsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/analytics')
      ]);
      setTickets(ticketsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Failed to update ticket', error);
    }
  };

  const handleDelete = async (ticketId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este chamado?')) return;
    try {
      await api.delete(`/tickets/${ticketId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete ticket', error);
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem' }}>
        <p>Carregando painel...</p>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status !== 'CLOSED').length;
  const closedTickets = tickets.filter(t => t.status === 'CLOSED').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Bem-vindo, {user?.name}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Veja as estatísticas e chamados pendentes.</p>
      </div>

      {/* Stats Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--status-open)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chamados Ativos</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{openTickets}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--status-closed)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Resolvidos</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{closedTickets}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }}>
            <Timer size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tempo Médio</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analytics?.avgResolutionTime?.toFixed(1) || '0'}h</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--status-progress)' }}>
            <UsersIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Tickets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tickets.length}</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {settings.visibleCharts.includes('user_open') && analytics?.topUserOpen && (
          <DashboardChart 
            type={settings.defaultChartType as any}
            title="Usuários com mais Chamados"
            data={analytics.topUserOpen}
            dataKeys={{ x: 'username', y: '_count.id' }}
          />
        )}
        {settings.visibleCharts.includes('tech_resolve') && analytics?.topTechResolve && (
          <DashboardChart 
            type={settings.defaultChartType as any}
            title="Técnicos com mais Resoluções"
            data={analytics.topTechResolve}
            dataKeys={{ x: 'techName', y: 'count' }}
          />
        )}
        {settings.visibleCharts.includes('category_freq') && analytics?.categoryFreq && (
          <DashboardChart 
            type={settings.defaultChartType as any}
            title="Chamados por Categoria"
            data={analytics.categoryFreq}
            dataKeys={{ x: 'category', y: 'count' }}
          />
        )}
        {settings.visibleCharts.includes('resolution_time') && (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 600 }}>Tempo Médio de Resolução</h3>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)', textAlign: 'center' }}>
              {analytics?.avgResolutionTime?.toFixed(1) || '0'}
              <span style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>horas</span>
            </div>
          </div>
        )}
      </div>

      {/* Ticket List Section */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BarChart3 size={20} color="var(--primary)" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Lista de Chamados Recentes</h3>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>Nenhum chamado encontrado</h3>
          <p>Não há chamados para exibir no momento.</p>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.1rem 0.5rem', fontSize: '0.65rem' }}>
                      {ticket.category?.name || 'Geral'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{ticket.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <span>Por: {ticket.author?.name || 'Desconhecido'}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} />
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {ticket.assignedTo && (
                      <>
                        <span>•</span>
                        <span>Atribuído a: {ticket.assignedTo?.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {ticket.authorId === user?.id && ticket.status === 'OPEN' && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
                      <button className="btn-secondary" style={{ padding: '0.4rem' }} onClick={() => navigate(`/tickets/edit/${ticket.id}`)}>
                        <Pencil size={16} />
                      </button>
                      <button className="btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => handleDelete(ticket.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {ticket.description}
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ticket.attachments.map(att => (
                    <a key={att.id} href={`http://localhost:3000/uploads/${att.path}`} target="_blank" rel="noopener noreferrer" className="glass-panel" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', textDecoration: 'none', color: 'inherit', background: 'rgba(255,255,255,0.05)' }}>
                      {att.mimetype.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                      <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.filename}</span>
                    </a>
                  ))}
                </div>
              )}
              
              {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                  <select 
                    className="select-field" 
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                  >
                    <option value="OPEN">Aberto</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="CLOSED">Fechado</option>
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
