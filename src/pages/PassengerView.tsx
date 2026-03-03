import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { BellButton } from '../components/BellButton';
import { ErrorBanner, PingBadge, formatTime } from '../components/ui';

type GeoState = 'idle' | 'requesting' | 'denied';

function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('Not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function PassengerView() {
  const { auth, logout, activeSession, myPingInActiveSession, createPing, loading, error, clearError, refresh } = useApp();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>('idle');

  const alreadyPinged = myPingInActiveSession !== null;
  const canPing = !!activeSession && !alreadyPinged;

  const handlePing = async () => {
    if (!canPing || submitting) return;
    setSubmitting(true);
    setGeoState('requesting');
    try {
      const { lat, lng } = await getLocation();
      setGeoState('idle');
      await createPing(note.trim() || undefined, lat, lng);
      setNote('');
    } catch {
      setGeoState('denied');
    } finally {
      setSubmitting(false);
    }
  };

  const ping = myPingInActiveSession;
  const statusText: Record<string, string> = { pending: 'Request sent', acknowledged: 'On the way', done: 'Done' };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-header__role">Passenger</span>
          <span className="app-header__name">{auth?.userName}</span>
        </div>
        <div className="app-header__right">
          <BellButton />
          <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}
            style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>↻</button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Out</button>
        </div>
      </header>

      {error && <div style={{ padding: '12px 20px 0' }}><ErrorBanner message={error} onDismiss={clearError} /></div>}

      <div className="passenger-main">

        {geoState === 'denied' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', maxWidth: 260 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Location required</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Your location is needed so the driver can find you.<br />
              Enable it in iPhone Settings → PickMeUp → Location → While Using.
            </div>
            <button className="btn btn-primary" onClick={() => setGeoState('idle')}
              style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>
              Try again
            </button>
          </div>
        ) : alreadyPinged && ping ? (
          <>
            <button className="ping-button sent" disabled>
              <div className="ping-check" />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="ping-status-label">{ping.status ? statusText[ping.status] : ''}</div>
              {ping.status && <PingBadge status={ping.status} />}
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{formatTime(ping.createdAt)}</div>
              {ping.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>"{ping.note}"</div>}
              {ping.lat && ping.lng && <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Location shared</div>}
            </div>
          </>
        ) : (
          <>
            <button className={`ping-button${canPing ? ' pulsing' : ''}`} onClick={handlePing}
              disabled={!canPing || submitting} aria-label="Request pickup">
              {geoState === 'requesting'
                ? <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '0 20px', lineHeight: 1.4 }}>Getting location…</div>
                : submitting ? <div className="spinner" />
                : <div className="ping-cross" />}
            </button>
            <div className="session-indicator">
              <div className={`session-indicator__dot${activeSession ? '' : ' off'}`} />
              <span>{activeSession ? activeSession.name : 'No active session'}</span>
            </div>
            {canPing && (
              <input className="input note-input" type="text" placeholder="Add a note"
                value={note} onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePing()}
                maxLength={100} disabled={submitting} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
