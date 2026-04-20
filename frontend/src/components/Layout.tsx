import { LogOut, LayoutDashboard, Users, PlusCircle, Sun, Moon, Tag, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { API_URL } from '../lib/api';

const Layout = () => {
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <button 
        onClick={() => navigate(to)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', 
          padding: '0.75rem 1rem', borderRadius: '8px', border: 'none',
          background: isActive ? 'var(--primary)' : 'transparent',
          color: isActive ? 'white' : 'var(--text)',
          cursor: 'pointer', textAlign: 'left',
          fontSize: '1rem', fontFamily: 'Outfit, sans-serif',
          transition: 'all 0.2s'
        }}
      >
        <Icon size={20} />
        {label}
      </button>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {settings.logoPath && (
            <img 
              src={`${API_URL}/uploads/${settings.logoPath}`} 
              alt="Logo" 
              style={{ height: '40px', objectFit: 'contain' }} 
            />
          )}
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, background: 'var(--primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {settings.appName}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleTheme} className="btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Alternar Tema">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div style={{ textAlign: 'right', minWidth: '100px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'TECHNICIAN' ? 'Técnico' : 'Usuário'}
            </div>
          </div>
          <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem' }} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: '250px', borderRight: '1px solid var(--surface-border)', padding: '1.5rem', background: 'var(--surface-panel)' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Chamados" />
            <NavItem to="/tickets/create" icon={PlusCircle} label="Novo Chamado" />
            {user?.role === 'ADMIN' && (
              <>
                <NavItem to="/admin/users" icon={Users} label="Usuários" />
                <NavItem to="/admin/categories" icon={Tag} label="Categorias" />
                <NavItem to="/admin/settings" icon={Settings} label="Configurações" />
              </>
            )}
          </nav>
        </aside>
        
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
