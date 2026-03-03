import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { BellButton } from '../components/BellButton';
import { ErrorBanner, formatTime } from '../components/ui';

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

// ── Button variants ───────────────────────────────────────────

function CrossIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <line x1="18" y1="4" x2="18" y2="32" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="4" y1="18" x2="32" y2="18" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <line x1="8" y1="8" x2="28" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="28" y1="8" x2="8" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function TickIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <polyline points="6,19 14,27 30,10" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

type ButtonVariant = 'ready' | 'disabled' | 'sent' | 'loading';

function PingButton({ variant, onClick }: { variant: ButtonVariant; onClick?: () => void }) {
  const colors: Record<ButtonVariant, string> = {
    ready: '#000000',
    disabled: '#cc2200',
    sent: '#1a8a3a',
    loading: '#000000',
  };

  const borderColors: Record<ButtonVariant, string> = {
    ready: 'rgba(255,255,255,0.15)',
    disabled: 'rgba(255,100,80,0.3)',
    sent: 'rgba(80,220,120,0.3)',
    loading: 'rgba(255,255,255,0.1)',
  };

  return (
    <button
      onClick={onClick}
      disabled={variant !== 'ready'}
      aria-label="Request pickup"
      className={`ping-btn ping-btn--${variant}`}
      style={{
        width: 'clamp(150px, 42vw, 200px)',
        height: 'clamp(150px, 42vw, 200px)',
        borderRadius: '50%',
        background: colors[variant],
        border: `2px solid ${borderColors[variant]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: variant === 'ready' ? 'pointer' : 'default',
        transition: 'background 300ms ease, transform 150ms ease, border-color 300ms ease',
        position: 'relative',
        flexShrink: 0,
        boxShadow: variant === 'ready'
          ? '0 8px 40px rgba(0,0,0,0.4)'
          : variant === 'sent'
          ? '0 8px 40px rgba(26,138,58,0.3)'
          : variant === 'disabled'
          ? '0 8px 40px rgba(204,34,0,0.25)'
          : '0 8px 40px rgba(0,0,0,0.3)',
      }}
    >
      {/* Pulse ring — only when ready */}
      {variant === 'ready' && (
        <span style={{
          position: 'absolute',
          inset: -16,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.12)',
          animation: 'ringPulse 2.5s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {variant === 'loading' && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2.5px solid rgba(255,255,255,0.2)',
          borderTopColor: 'white',
          animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {variant === 'ready' && <CrossIcon />}
      {variant === 'disabled' && <XIcon />}
      {variant === 'sent' && <TickIcon />}
    </button>
  );
}

// ── Status label ──────────────────────────────────────────────

function StatusLabel({ status, createdAt }: { status: string; createdAt: string }) {
  const labels: Record<string, string> = {
    pending: 'Request sent',
    acknowledged: 'On the way',
    done: 'Done',
  };
  const colors: Record<string, string> = {
    pending: 'rgba(255,255,255,0.5)',
    acknowledged: '#4fc97e',
    done: 'rgba(255,255,255,0.35)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 500, color: colors[status] ?? 'rgba(255,255,255,0.5)' }}>
        {labels[status] ?? status}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{formatTime(createdAt)}</span>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────

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

  const buttonVariant: ButtonVariant =
    submitting ? 'loading'
    : alreadyPinged ? 'sent'
    : !activeSession ? 'disabled'
    : 'ready';

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header" >
        <div className="app-header__left">
          <span className="app-header__role" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>
            Passenger
          </span>
          <span style={{ fontSize: 'clamp(13px, 4vw, 16px)', fontWeight: 500 }}>{auth?.userName}</span>
        </div>
        <div className="app-header__right">
          <BellButton />
          <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}
            style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>
            ↻
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Out
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '10px 20px 0' }}>
          <ErrorBanner message={error} onDismiss={clearError} />
        </div>
      )}

      {/* Location denied screen */}
      {geoState === 'denied' ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '24px', gap: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Location required</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 260 }}>
            Your location is needed so the driver can find you.<br />
            Go to Settings → PickMeUp → Location → While Using.
          </div>
          <button className="btn btn-primary" onClick={() => setGeoState('idle')}
            style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px', marginTop: 4 }}>
            Try again
          </button>
        </div>
      ) : (
        /* Main content */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 'clamp(16px, 5vw, 32px)', gap: 'clamp(24px, 6vw, 40px)',
          minHeight: 0,
        }}>

          <PingButton
            variant={buttonVariant}
            onClick={handlePing}
          />

          {/* Session / status info */}
          {alreadyPinged && myPingInActiveSession ? (
            <StatusLabel status={myPingInActiveSession.status} createdAt={myPingInActiveSession.createdAt} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'clamp(11px, 3vw, 13px)', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: activeSession ? '#4fc97e' : 'rgba(255,255,255,0.2)',
                  flexShrink: 0,
                }} />
                {activeSession ? activeSession.name : 'No active session'}
              </div>

              {canPing && (
                <input
                  className="input note-input"
                  type="text"
                  placeholder="Add a note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePing()}
                  maxLength={100}
                  disabled={submitting}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    marginTop: 4,
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
