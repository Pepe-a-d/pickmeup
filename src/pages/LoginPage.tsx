import { useState, useRef, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { ErrorBanner, Spinner } from '../components/ui';

export function LoginPage() {
  const { login, loading, error, clearError } = useApp();
  const [code, setCode] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    if (!code.trim()) return;
    const ok = await login(code.trim());
    if (ok) setCode('');
  };

  return (
    <div className="login-page">
      <div className="login-form">
        {error && <ErrorBanner message={error} onDismiss={clearError} />}
        <input
          ref={ref}
          className="input login-input"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="CODE"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && submit()}
          disabled={loading}
          maxLength={20}
        />
        <button
          className="btn btn-primary btn-full"
          onClick={submit}
          disabled={loading || !code.trim()}
          style={{ borderRadius: 'var(--radius-lg)', padding: '13px', fontSize: '14px' }}
        >
          {loading ? <Spinner /> : 'Enter'}
        </button>
      </div>
      <div className="login-hint">Enter your access code</div>
    </div>
  );
}
