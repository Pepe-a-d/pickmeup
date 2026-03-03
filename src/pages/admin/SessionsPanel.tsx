import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { ConfirmDelete, EmptyState, SectionHeader } from '../../components/ui';

export function SessionsPanel() {
  const { sessions, activeSession, createSession, activateSession, deactivateSession, deleteSession, loading } = useApp();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await createSession(name.trim());
    setName('');
    setCreating(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setWorking(id);
    if (isActive) await deactivateSession(id);
    else await activateSession(id);
    setWorking(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteSession(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="section">
      <SectionHeader title="Sessions" />
      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          type="text"
          placeholder="Session name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          maxLength={50}
          disabled={creating || loading}
          autoCapitalize="words"
        />
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating || loading || !name.trim()}>
          Add
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="No sessions" subtitle="Create a session to accept requests" />
      ) : (
        <div className="list-card">
          {sessions.map(session => {
            const isActive = session.id === activeSession?.id;
            const isWorking = working === session.id;
            return (
              <div key={session.id} className="row-item">
                <div className={`status-dot ${isActive ? 'active' : 'inactive'}`} />
                <div className="row-item__body">
                  <div className="row-item__title">{session.name}</div>
                  <div className="row-item__subtitle">
                    {isActive ? 'Live' : session.closedAt
                      ? `Closed ${new Date(session.closedAt).toLocaleDateString()}`
                      : new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleToggle(session.id, isActive)}
                  disabled={isWorking}
                  style={{ minWidth: 60 }}
                >
                  {isWorking ? '…' : isActive ? 'Close' : 'Open'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDeleteTarget({ id: session.id, name: session.name })}
                  disabled={isActive}
                  aria-label={`Delete ${session.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
