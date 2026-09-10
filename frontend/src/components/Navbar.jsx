import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, FlaskConical, MonitorCheck, AlertTriangle, ScrollText, Info, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const navItems = [
  { to: '/security-center', label: 'Security Center', icon: LayoutDashboard },
  { to: '/lab',             label: 'Security Lab',    icon: FlaskConical     },
  { to: '/session',         label: 'Active Session',  icon: MonitorCheck     },
  { to: '/incidents',       label: 'SOC Incidents',   icon: AlertTriangle    },
  { to: '/audit',           label: 'Audit Log',       icon: ScrollText       },
  { to: '/about',           label: 'About',           icon: Info             },
];

export default function Navbar() {
  const { user, logout }   = useAuth();
  const { session }        = useSession();
  const navigate           = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-0 border-b"
      style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
        height: '56px',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <ShieldCheck size={20} style={{ color: 'var(--color-accent)' }} />
        <span className="font-semibold tracking-wide text-sm" style={{ color: 'var(--color-text-primary)' }}>
          ZTGuard
        </span>
        <span
          className="label-tag px-2 py-0.5 rounded"
          style={{
            color: 'var(--color-accent)',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            fontSize: '9px',
          }}
        >
          EDU PROTOTYPE
        </span>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors`
            }
            style={({ isActive }) => ({
              color:      isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
            })}
          >
            <Icon size={14} />
            {label}
            {/* Active session dot indicator */}
            {to === '/session' && session && (
              <span
                className="pulse-dot inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--color-low)' }}
              />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {user.name}
            </span>
            <span className="label-tag" style={{ color: 'var(--color-text-muted)', fontSize: '9px' }}>
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
          style={{
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  );
}
