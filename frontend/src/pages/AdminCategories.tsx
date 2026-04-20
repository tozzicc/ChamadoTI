import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setName('');
    setDescription('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name, description });
      } else {
        await api.post('/categories', { name, description });
      }
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar categoria');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria? Isso pode afetar chamados existentes.')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert('Erro ao excluir categoria');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando categorias...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Gerenciar Categorias</h2>
          <p style={{ color: 'var(--text-muted)' }}>Defina os tipos de atendimento disponíveis no sistema.</p>
        </div>
        <button className="btn-primary" onClick={showForm ? resetForm : () => setShowForm(true)}>
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Fechar Form' : 'Nova Categoria'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            {editingCategory ? `Editando: ${editingCategory.name}` : 'Cadastrar Nova Categoria'}
          </h3>
          
          {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="label">Nome da Categoria</label>
              <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Infraestrutura, Software..." />
            </div>
            <div>
              <label className="label">Descrição (Opcional)</label>
              <textarea className="textarea-field" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Breve descrição do que esta categoria atende" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'Salvando...' : editingCategory ? 'Atualizar Categoria' : 'Salvar Categoria'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--surface-border)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nome</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Descrição</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={14} className="text-primary" />
                    {cat.name}
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {cat.description || 'Sem descrição'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEdit(cat)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => handleDelete(cat.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AdminCategories;
