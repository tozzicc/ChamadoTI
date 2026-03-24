import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

const CreateTicket = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/tickets', { title, description, priority });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar chamado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Novo Chamado</h2>
        <p style={{ color: 'var(--text-muted)' }}>Descreva o seu problema detalhadamente para nossa equipe.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="label">Título do Chamado</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ex: Impressora não funciona"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Prioridade</label>
            <select 
              className="select-field"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
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
              placeholder="Descreva o que está acontecendo, quando começou, etc."
              rows={6}
              style={{ resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-outline" onClick={() => navigate('/dashboard')}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Abrir Chamado'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateTicket;
