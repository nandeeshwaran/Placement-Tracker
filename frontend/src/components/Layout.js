import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../components/Layout.css';
import ToastProvider from './Toast';
import { useAuth } from '../auth/AuthContext';

function Icon({ children }) {
  return <span className="layout-icon" aria-hidden>{children}</span>;
}

function Avatar({ name, onClick }) {
  const initials = (name || 'U S').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return (
    <button className="layout-avatar" onClick={onClick} aria-haspopup="true" aria-expanded="false">
      {initials}
    </button>
  );
}

export default function Layout({ children }) {
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sidebar-collapsed')) || false; } catch { return false; }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const navigate = useNavigate();
  const ddRef = useRef();

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(()=>{
    try{
      if(theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', theme);
    }catch(e){}
  },[theme]);

  useEffect(() => {
    function onDoc(e) {
      if (ddRef.current && !ddRef.current.contains(e.target)) setOpenDropdown(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={`layout-root ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <aside className="layout-sidebar" aria-label="Main navigation">
        <div className="layout-brand">
          <div className="brand-mark">PT</div>
          {!collapsed && <div className="brand-title">Placement Tracker</div>}
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin-dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} title="Dashboard">
            <Icon>🏠</Icon>
            {!collapsed && <span className="nav-text">Dashboard</span>}
          </NavLink>

          <NavLink to="/students" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} title="Students">
            <Icon>🎓</Icon>
            {!collapsed && <span className="nav-text">Students</span>}
          </NavLink>

          {/* Show campus/off-campus links only to students. Admins should not see company links in the sidebar. */}
          {auth?.role === 'student' && (
            <>
              <NavLink to="/company-selection" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} title="On Campus">
                <Icon>🏢</Icon>
                {!collapsed && <span className="nav-text">On Campus</span>}
              </NavLink>

              <NavLink to="/ofcompany-selection" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} title="Off Campus">
                <Icon>🚀</Icon>
                {!collapsed && <span className="nav-text">Off Campus</span>}
              </NavLink>

              {/* Student-only: My Resume Summary */}
              <NavLink to="/my-resume" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} title="My Resume">
                <Icon>📄</Icon>
                {!collapsed && <span className="nav-text">My Resume</span>}
              </NavLink>
            </>
          )}

          {/* Campus link removed from sidebar per request */}
        </nav>

        <div className="layout-footer">
          <button className="collapse-toggle" onClick={() => setCollapsed(v => !v)} aria-pressed={collapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? '➤' : '◀'}
          </button>
        </div>
      </aside>
  {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-hidden />}

      <div className="layout-main">
        <header className="layout-topbar">
          <div className="topbar-left">
            <button className="hamburger" aria-label="Toggle menu" onClick={() => setMobileOpen(v=>!v)}>☰</button>
          </div>
          <div className="topbar-right">
            <div className="topbar-actions">
                <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle dark mode">{theme === 'dark' ? '🌙' : '☀️'}</button>
                <div className="user-area" ref={ddRef}>
                  <Avatar name={auth.user?.username || null} onClick={() => setOpenDropdown(s => !s)} />
                  {openDropdown && (
                    <>
                      <ul className="user-dropdown" role="menu">
                        <li role="menuitem"><button onClick={() => { setOpenDropdown(false); navigate('/'); }}>Profile</button></li>
                        <li role="menuitem"><button onClick={() => { setOpenDropdown(false); navigate('/'); }}>Settings</button></li>
                        <li role="menuitem"><button onClick={() => { setOpenDropdown(false); auth.logout(); navigate('/'); }}>Logout</button></li>
                      </ul>
                      {/* Visible logout label next to avatar when dropdown is open */}
                      <button className="topbar-logout-text" onClick={() => { setOpenDropdown(false); auth.logout(); navigate('/'); }}>Logout</button>
                    </>
                  )}
                </div>
              </div>
          </div>
        </header>

        <main className="layout-content">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
