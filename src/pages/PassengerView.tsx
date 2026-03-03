import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { BellButton } from '../components/BellButton';
import { ErrorBanner, PingBadge, formatTime } from '../components/ui';

export function PassengerView() {
  const { auth, logout, activeSession, myPingInActiveSession, createPing, loading, error, clearError, refresh } = useApp();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const alreadyPinged = myPingInActiveSession !== null;
  const canPing = !!activeSession && !alreadyPinged;

  const handlePing = async () => {
    if (!canPing || submitting) return;
    setSubmitting(true);
    await createPing(note.trim() || undefined);
    setNote('');
    setSubmitting(false);
  };

  const ping = myPingInActiveSession;
  const statusText: Record<string, string> = {
    pending: 'Request sent',
    acknowledged: 'On the way',
    done: 'Done',
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-header__role">Passenger</span>
          <span className="app-header__name">{auth?.userName}</span>
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

      <div className="passenger-main">
        {alreadyPinged && ping ? (
          <>
            <button className="ping-button sent" disabled>
              <div className="ping-check" />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="ping-status-label">{ping.status ? statusText[ping.status] : ''}</div>
              {ping.status && <PingBadge status={ping.status} />}
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                {formatTime(ping.createdAt)}
              </div>
              {ping.note && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                  "{ping.note}"
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              className={`ping-button${canPing ? ' pulsing' : ''}`}
              onClick={handlePing}
              disabled={!canPing || submitting}
              aria-label="Request pickup"
            >
              {submitting ? <div className="spinner" /> : <div className="ping-cross" />}
            </button>
            <div className="session-indicator">
              <div className={`session-indicator__dot${activeSession ? '' : ' off'}`} />
              <span>{activeSession ? activeSession.name : 'No active session'}</span>
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
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
