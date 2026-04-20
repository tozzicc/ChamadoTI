import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../contexts/SettingsContext';
import { API_URL } from '../lib/api';
import { Save, Upload, Settings as SettingsIcon, Mail, Laptop, LayoutGrid } from 'lucide-react';

const Settings = () => {
  const { settings, refreshSettings } = useSettings();
  const [formData, setFormData] = useState({
    appName: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    defaultChartType: 'BAR'
  });
  const [visibleCharts, setVisibleCharts] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        appName: settings.appName || '',
        smtpHost: (settings as any).smtpHost || '',
        smtpPort: (settings as any).smtpPort?.toString() || '',
        smtpUser: (settings as any).smtpUser || '',
        smtpPass: '', // Don't show password
        smtpSecure: (settings as any).smtpSecure || false,
        defaultChartType: settings.defaultChartType || 'BAR'
      });
      setVisibleCharts(settings.visibleCharts || []);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleChartToggle = (chartId: string) => {
    if (visibleCharts.includes(chartId)) {
      setVisibleCharts(visibleCharts.filter(id => id !== chartId));
    } else {
      setVisibleCharts([...visibleCharts, chartId]);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Update general settings
      await axios.put(`${API_URL}/settings`, {
        ...formData,
        visibleCharts: JSON.stringify(visibleCharts)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update logo if file selected
      if (logoFile) {
        const logoData = new FormData();
        logoData.append('logo', logoFile);
        await axios.post(`${API_URL}/settings/logo`, logoData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setMessage('Configurações atualizadas com sucesso!');
      refreshSettings();
    } catch (error) {
      console.error(error);
      setMessage('Erro ao atualizar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = [
    { id: 'user_open', label: 'Usuário que mais abre' },
    { id: 'tech_resolve', label: 'Técnico que mais resolve' },
    { id: 'resolution_time', label: 'Tempo de resolução' },
    { id: 'category_freq', label: 'Volume por Categoria' },
  ];

  return (
    <div className="settings-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <SettingsIcon size={32} color="var(--primary)" />
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Configurações do Sistema</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        {message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            background: message.includes('Erro') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: message.includes('Erro') ? 'var(--danger)' : 'var(--success)',
            marginBottom: '1.5rem',
            border: `1px solid ${message.includes('Erro') ? 'var(--danger)' : 'var(--success)'}`
          }}>
            {message}
          </div>
        )}

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
            <Laptop size={20} /> Identidade Visual
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <label className="label">Nome da Plataforma</label>
              <input 
                type="text" 
                name="appName" 
                className="input-field" 
                value={formData.appName} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="label">Logotipo (PNG/JPG)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="file" 
                  id="logo-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleLogoChange}
                  accept="image/*"
                />
                <label htmlFor="logo-upload" className="btn-secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={18} /> Escolher Arquivo
                </label>
                {logoFile && <span style={{ fontSize: '0.875rem', color: 'var(--success)' }}>{logoFile.name} (Pronto para salvar)</span>}
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
            <Mail size={20} /> Configurações de E-mail (SMTP)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Servidor SMTP</label>
              <input type="text" name="smtpHost" className="input-field" value={formData.smtpHost} onChange={handleChange} placeholder="ex: smtp.gmail.com" />
            </div>
            <div>
              <label className="label">Porta</label>
              <input type="number" name="smtpPort" className="input-field" value={formData.smtpPort} onChange={handleChange} placeholder="ex: 587" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
              <input type="checkbox" id="smtpSecure" name="smtpSecure" checked={formData.smtpSecure} onChange={handleChange} />
              <label htmlFor="smtpSecure" style={{ fontSize: '0.875rem', fontWeight: 500 }}>SSL/TLS Seguro</label>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Usuário (E-mail)</label>
              <input type="text" name="smtpUser" className="input-field" value={formData.smtpUser} onChange={handleChange} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Senha</label>
              <input type="password" name="smtpPass" className="input-field" value={formData.smtpPass} onChange={handleChange} placeholder="Deixe em branco para não alterar" />
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
            <LayoutGrid size={20} /> Painel de Analytics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <label className="label">Gráficos Ativos</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {chartOptions.map(opt => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--surface-panel)', padding: '0.75rem', borderRadius: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={visibleCharts.includes(opt.id)} 
                      onChange={() => handleChartToggle(opt.id)} 
                    />
                    <span style={{ fontSize: '0.875rem' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Estilo de Gráfico Padrão</label>
              <select name="defaultChartType" className="select-field" value={formData.defaultChartType} onChange={handleChange}>
                <option value="BAR">Barras</option>
                <option value="PIE">Pizza</option>
                <option value="LINE">Linhas</option>
              </select>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '200px' }}>
            <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
