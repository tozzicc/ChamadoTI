import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Plus, UserPlus } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  username: string;
  role: string;
  createdAt: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      await api.post('/admin/users', { name, username, password, role });
      setShowForm(false);
      setName('');
      setUsername('');
      setPassword('');
      setRole('USER');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar usuário');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando usuários...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Gerenciar Usuários</h2>
          <p style={{ color: 'var(--text-muted)' }}>Adicione e visualize membros da equipe.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={18} />
          {showForm ? 'Cancelar' : 'Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Cadastro de Novo Usuário</h3>
          
          {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="label">Nome Completo</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Nome de Usuário (Login)</label>
                <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="label">Senha</label>
                <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="label">Papel (Role)</label>
                <select className="select-field" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="USER">Usuário (Apenas cria chamados)</option>
                  <option value="ADMIN">Administrador (Atende e gerencia equipe)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'Salvando...' : 'Salvar Usuário'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--surface-border)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nome</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Login</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Permissão</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Data de Criação</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => (
              <tr key={userItem.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>{userItem.name}</td>
                <td style={{ padding: '1rem', color: 'var(--primary)' }}>{userItem.username}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${userItem.role === 'ADMIN' ? 'badge-progress' : 'badge-open'}`}>
                    {userItem.role}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AdminUsers;
