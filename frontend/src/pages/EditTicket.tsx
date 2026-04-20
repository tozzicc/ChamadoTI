import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Plus, X, Paperclip } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

const EditTicket = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [removeAttachments, setRemoveAttachments] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, ticketRes] = await Promise.all([
          api.get('/categories'),
          api.get('/tickets') // This is a bit inefficient, but since we don't have a single-ticket GET endpoint documented, I'll filter from the list or assume the user wants access to their own.
        ]);
        
        setCategories(catsRes.data);
        
        const ticket = ticketRes.data.find((t: any) => t.id === parseInt(id!));
        if (ticket) {
          setTitle(ticket.title);
          setDescription(ticket.description);
          setPriority(ticket.priority);
          setCategoryId(ticket.category.id.toString());
          setExistingAttachments(ticket.attachments || []);
          
          if (ticket.status !== 'OPEN') {
            setError('Este chamado já está em atendimento e não pode mais ser editado.');
          }
        } else {
          setError('Chamado não encontrado.');
        }
      } catch (err) {
        console.error('Failed to load data', err);
        setError('Erro ao carregar dados do chamado.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const activeExisting = existingAttachments.filter(a => !removeAttachments.includes(a.id));
      const totalFiles = activeExisting.length + files.length + selectedFiles.length;
      
      if (totalFiles > 3) {
        setError('Você pode anexar no máximo 3 arquivos.');
        return;
      }
      
      const totalSize = [...files, ...selectedFiles].reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 10 * 1024 * 1024) {
        setError('O tamanho total dos novos arquivos não pode ultrapassar 10MB.');
        return;
      }

      setFiles(prev => [...prev, ...selectedFiles]);
      setError('');
    }
  };

  const removeNewFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const markForRemoval = (id: number) => {
    setRemoveAttachments(prev => [...prev, id]);
  };

  const unmarkForRemoval = (id: number) => {
    setRemoveAttachments(prev => prev.filter(aid => aid !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Por favor, selecione uma categoria.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('categoryId', categoryId);
      formData.append('removeAttachments', JSON.stringify(removeAttachments));
      files.forEach(file => formData.append('files', file));

      await api.put(`/tickets/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar chamado');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando dados...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Editar Chamado</h2>
        <p style={{ color: 'var(--text-muted)' }}>Atualize as informações do seu chamado.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="label">Título do Chamado</label>
              <input 
                type="text" 
                className="input-field" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={error.includes('atendimento')}
              />
            </div>

            <div>
              <label className="label">Categoria do Atendimento</label>
              <select 
                className="select-field"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={error.includes('atendimento')}
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Prioridade</label>
            <select 
              className="select-field"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={error.includes('atendimento')}
            >
              <option value="LOW">Baixa - Não impede meu trabalho</option>
              <option value="MEDIUM">Média - Dificulta meu trabalho</option>
              <option value="HIGH">Alta - Impede meu trabalho completamente</option>
            </select>
          </div>

          <div>
            <label className="label">Descrição Detalhada</label>
            <textarea 
              className="textarea-field" 
              rows={6}
              style={{ resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={error.includes('atendimento')}
            />
          </div>

          <div>
            <label className="label">Anexos (Máx 3 arquivos no total)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Existing Attachments */}
              {existingAttachments.map((att) => {
                const isRemoved = removeAttachments.includes(att.id);
                return (
                  <div key={att.id} className="glass-panel" style={{ 
                    padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                    background: isRemoved ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', 
                    fontSize: '0.875rem', opacity: isRemoved ? 0.6 : 1,
                    textDecoration: isRemoved ? 'line-through' : 'none'
                  }}>
                    <Paperclip size={14} />
                    <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.filename}</span>
                    <button type="button" onClick={() => isRemoved ? unmarkForRemoval(att.id) : markForRemoval(att.id)} 
                            style={{ background: 'transparent', border: 'none', color: isRemoved ? 'var(--primary)' : 'var(--danger)', cursor: 'pointer', padding: 0 }}>
                      {isRemoved ? <Plus size={16} /> : <X size={16} />}
                    </button>
                  </div>
                );
              })}

              {/* New Files */}
              {files.map((file, index) => (
                <div key={index} className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-glow)', fontSize: '0.875rem' }}>
                  <Paperclip size={14} />
                  <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name} (Novo)</span>
                  <button type="button" onClick={() => removeNewFile(index)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}>
                    <X size={16} />
                  </button>
                </div>
              ))}

              {(existingAttachments.length - removeAttachments.length + files.length) < 3 && (
                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <Plus size={18} /> Adicionar Arquivo
                  <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-outline" onClick={() => navigate('/dashboard')}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving || error.includes('atendimento')}>
              {saving ? 'Atualizando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditTicket;
