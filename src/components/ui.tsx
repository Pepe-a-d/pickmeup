import type { ReactNode } from 'react';
import type { PingStatus } from '../types';

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}

export function Spinner({ large }: { large?: boolean }) {
  return <div className={`spinner${large ? ' spinner-lg' : ''}`} role="status" />;
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="loading-state">
      <Spinner large />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="empty-state">
      <div style={{ fontWeight: 500, marginBottom: subtitle ? 4 : 0 }}>{title}</div>
      {subtitle && <div style={{ marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

const STATUS_LABEL: Record<PingStatus, string> = {
  pending: 'Pending',
  acknowledged: 'En route',
  done: 'Done',
};

export function PingBadge({ status }: { status: PingStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <div className="section-label">{title}</div>
      {action}
    </div>
  );
}

export function ConfirmDelete({ name, onConfirm, onCancel }: {
  name: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <div className="dialog-box__title">Delete {name}?</div>
        <div className="dialog-box__body">This cannot be undone.</div>
        <div className="dialog-box__actions">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
