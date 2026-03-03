import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { ConfirmDelete, EmptyState, SectionHeader } from '../../components/ui';

export function UsersPanel() {
  const { users, createUser, deleteUser, loading } = useApp();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await createUser(name.trim());
    setName('');
    setCreating(false);
  };

  const handleCopy = (code: string, userId: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(userId);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteUser(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="section">
      <SectionHeader title="Passengers" />
      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          maxLength={40}
          disabled={creating || loading}
          autoCapitalize="words"
        />
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating || loading || !name.trim()}>
          Add
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No passengers" subtitle="Add a passenger to generate their code" />
      ) : (
        <div className="list-card">
          {users.map(user => (
            <div key={user.id} className="row-item">
              <div className="row-item__body">
                <div className="row-item__title">{user.name}</div>
                <div className="row-item__subtitle">{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
              <button
                className={`code-chip${copied === user.id ? ' copied' : ''}`}
                onClick={() => handleCopy(user.code, user.id)}
              >
                {copied === user.id ? 'Copied' : user.code}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                aria-label={`Delete ${user.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {users.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>
          Tap a code to copy
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
