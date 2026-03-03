import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { BellButton } from '../components/BellButton';
import { ErrorBanner } from '../components/ui';
import { PingsPanel } from './admin/PingsPanel';
import { SessionsPanel } from './admin/SessionsPanel';
import { UsersPanel } from './admin/UsersPanel';

type Tab = 'pings' | 'sessions' | 'users';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pings', label: 'Requests' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'users', label: 'Passengers' },
];

export function AdminDashboard() {
  const { logout, error, clearError, activeSession, pings, refresh, loading } = useApp();
  const [tab, setTab] = useState<Tab>('pings');

  const pendingCount = activeSession
    ? pings.filter(p => p.sessionId === activeSession.id && p.status === 'pending').length
    : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-header__role">Admin</span>
          {activeSession && (
            <div className="live-bar" style={{ margin: 0, padding: '3px 10px', fontSize: 11 }}>
              <div className="live-bar__dot" />
              {activeSession.name}
            </div>
          )}
        </div>
        <div className="app-header__right">
          <BellButton />
          <button
            className="btn btn-ghost btn-sm"
            onClick={refresh}
            disabled={loading}
            style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}
          >
            ↻
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Out</button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '12px 20px 0' }}>
          <ErrorBanner message={error} onDismiss={clearError} />
        </div>
      )}

      <main className="app-content">
        {tab === 'pings' && <PingsPanel />}
        {tab === 'sessions' && <SessionsPanel />}
        {tab === 'users' && <UsersPanel />}
      </main>

      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-bar__item${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <div className="tab-bar__icon">
              {t.id === 'pings' && pendingCount > 0 && (
                <span className="count-badge">{pendingCount}</span>
              )}
            </div>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
