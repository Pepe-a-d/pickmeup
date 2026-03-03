import { useApp } from '../hooks/useApp';

export function BellButton() {
  const { pushEnabled, requestPush } = useApp();
  return (
    <button
      onClick={requestPush}
      aria-label={pushEnabled ? 'Notifications enabled' : 'Enable notifications'}
      title={pushEnabled ? 'Notifications on' : 'Enable notifications'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        padding: 0,
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '50%',
        cursor: 'pointer',
        color: pushEnabled ? 'var(--text)' : 'var(--text-faint)',
        transition: 'color 150ms, border-color 150ms',
        flexShrink: 0,
      }}
    >
      <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        {!pushEnabled && <line x1="2" y1="2" x2="22" y2="22" />}
      </svg>
    </button>
  );
}
