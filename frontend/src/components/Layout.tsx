import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, PlusCircle } from 'lucide-react';

const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, background: 'var(--primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Chamado TI
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</div>
          </div>
          <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem 1rem' }} title="Sair">
            <LogOut size={18} />
            <span style={{ display: 'none' }}>Sair</span>
          </button>
        </div>
      </header>
      
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: '250px', borderRight: '1px solid var(--surface-border)', padding: '1.5rem', background: 'rgba(24, 24, 27, 0.4)' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Chamados" />
            <NavItem to="/tickets/create" icon={PlusCircle} label="Novo Chamado" />
            {user?.role === 'ADMIN' && (
              <NavItem to="/admin/users" icon={Users} label="Usuários" />
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
