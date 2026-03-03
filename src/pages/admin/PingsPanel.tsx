import { useApp } from '../../hooks/useApp';
import { EmptyState, PingBadge, SectionHeader, formatTime } from '../../components/ui';
import type { Ping, PingStatus } from '../../types';

const STATUS_OPTIONS: { value: PingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'acknowledged', label: 'En route' },
  { value: 'done', label: 'Done' },
];

function LocationLink({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  // Apple Maps URL (opens natively on iPhone), falls back to Google Maps
  const appleUrl = `maps://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;
  const googleUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  const handleTap = () => {
    // Try Apple Maps first; if it fails (e.g. on desktop), open Google Maps
    const start = Date.now();
    window.location.href = appleUrl;
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.open(googleUrl, '_blank');
      }
    }, 500);
  };

  return (
    <button
      onClick={handleTap}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'none', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-full)', padding: '2px 10px',
        fontSize: 11, color: 'var(--text)', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'border-color 150ms',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      {lat.toFixed(5)}, {lng.toFixed(5)}
    </button>
  );
}

function PingItem({ ping, onStatusChange }: { ping: Ping; onStatusChange: (id: string, s: PingStatus) => void }) {
  return (
    <div className="ping-item">
      <div className="ping-item__top">
        <span className="ping-item__name">{ping.userName}</span>
        <span className="ping-item__time">{formatTime(ping.createdAt)}</span>
        <select className="status-select" value={ping.status}
          onChange={e => onStatusChange(ping.id, e.target.value as PingStatus)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="ping-item__bottom">
        <PingBadge status={ping.status} />
        {ping.note && <span className="ping-item__note">"{ping.note}"</span>}
        {ping.lat && ping.lng && (
          <LocationLink lat={ping.lat} lng={ping.lng} name={ping.userName} />
        )}
        <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto', fontFamily: 'monospace' }}>
          #{ping.id.slice(-6)}
        </span>
      </div>
    </div>
  );
}

export function PingsPanel() {
  const { pings, activeSession, sessions, updatePingStatus } = useApp();
  const livePings = activeSession ? pings.filter(p => p.sessionId === activeSession.id) : [];
  const pastPings = activeSession ? pings.filter(p => p.sessionId !== activeSession.id) : pings;
  const pendingCount = livePings.filter(p => p.status === 'pending').length;
  const getSessionName = (id: string) => sessions.find(s => s.id === id)?.name ?? '—';

  return (
    <>
      <div className="section">
        <SectionHeader
          title={activeSession ? activeSession.name : 'Live'}
          action={pendingCount > 0 ? <span className="count-badge">{pendingCount} pending</span> : undefined}
        />
        {livePings.length === 0 ? (
          <EmptyState
            title={activeSession ? 'No requests yet' : 'No active session'}
            subtitle={activeSession ? 'Waiting for passengers' : 'Open a session first'}
          />
        ) : (
          <div className="list-card">
            {livePings.map(p => <PingItem key={p.id} ping={p} onStatusChange={updatePingStatus} />)}
          </div>
        )}
      </div>

      {pastPings.length > 0 && (
        <div className="section">
          <SectionHeader title="History" />
          <div className="list-card">
            {pastPings.slice(0, 30).map(p => (
              <div key={p.id} className="row-item">
                <div className="row-item__body">
                  <div className="row-item__title">{p.userName}</div>
                  <div className="row-item__subtitle">{getSessionName(p.sessionId)} · {formatTime(p.createdAt)}</div>
                </div>
                <PingBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
