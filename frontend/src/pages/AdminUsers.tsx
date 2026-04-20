import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { UserPlus, Edit2, Trash2, ShieldOff, ShieldCheck, Mail, X } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
  specialties: { id: number; name: string }[];
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, catsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/categories')
      ]);
      setUsers(usersRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    const payload = { 
      name, 
      username, 
      email, 
      role, 
      password: password || undefined,
      specialties: role === 'TECHNICIAN' ? selectedSpecialties : []
    };

    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await api.post('/admin/users', payload);
      }
      
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('USER');
    setSelectedSpecialties([]);
    setError('');
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email || '');
    setRole(user.role);
    setSelectedSpecialties(user.specialties.map(s => s.id));
    setPassword(''); // Don't show password
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir usuário');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status do usuário');
    }
  };

  const toggleSpecialty = (id: number) => {
    setSelectedSpecialties(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando dados...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Gerenciar Usuários</h2>
          <p style={{ color: 'var(--text-muted)' }}>Adicione, edite ou remova membros da equipe.</p>
        </div>
        <button className="btn-primary" onClick={showForm ? resetForm : () => setShowForm(true)}>
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm ? 'Fechar Form' : 'Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            {editingUser ? `Editando: ${editingUser.name}` : 'Cadastro de Novo Usuário'}
          </h3>
          
          {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

          <form onSubmit={handleCreateOrUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="label">Nome Completo</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">E-mail (para notificações)</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="exemplo@email.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="label">Nome de Usuário (Login)</label>
                <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={!!editingUser} />
              </div>
              <div>
                <label className="label">Senha {editingUser && '(Deixe em branco para manter a atual)'}</label>
                <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required={!editingUser} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: role === 'TECHNICIAN' ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
              <div>
                <label className="label">Papel (Role)</label>
                <select className="select-field" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="USER">Usuário (Quem abre o chamado)</option>
                  <option value="ADMIN">Administrador (Gestão Total)</option>
                  <option value="TECHNICIAN">Técnico (Quem responde o chamado)</option>
                </select>
              </div>

              {role === 'TECHNICIAN' && (
                <div>
                  <label className="label">Categorias de Atendimento (Especialidades)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    {categories.map(cat => (
                      <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedSpecialties.includes(cat.id)} 
                          onChange={() => toggleSpecialty(cat.id)}
                        />
                        {cat.name}
                      </label>
                    ))}
                    {categories.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Cadastre categorias primeiro!</span>}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'Salvando...' : editingUser ? 'Atualizar Usuário' : 'Salvar Usuário'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--surface-border)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nome</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Login/E-mail</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Permissão</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => (
              <tr key={userItem.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: userItem.isActive ? 1 : 0.6 }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{userItem.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Criado em {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 500 }}>{userItem.username}</div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                    <Mail size={12} /> {userItem.email || 'Sem e-mail'}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${userItem.role === 'ADMIN' ? 'badge-progress' : userItem.role === 'TECHNICIAN' ? 'badge-closed' : 'badge-open'}`}>
                    {userItem.role === 'TECHNICIAN' ? 'TÉCNICO' : userItem.role}
                  </span>
                  {userItem.role === 'TECHNICIAN' && userItem.specialties?.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {userItem.specialties.map(s => s.name).join(', ')}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: userItem.isActive ? 'var(--success)' : 'var(--danger)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: userItem.isActive ? 'var(--success)' : 'var(--danger)' }}></div>
                    {userItem.isActive ? 'Ativo' : 'Bloqueado'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.4rem' }} title="Editar" onClick={() => handleEdit(userItem)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.4rem', color: userItem.isActive ? 'var(--warning)' : 'var(--success)' }} 
                            title={userItem.isActive ? "Bloquear" : "Desbloquear"} onClick={() => handleToggleStatus(userItem.id)}>
                      {userItem.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} 
                            title="Excluir" onClick={() => handleDelete(userItem.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
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
