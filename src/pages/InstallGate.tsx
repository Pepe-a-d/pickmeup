const BYPASS = import.meta.env.VITE_BYPASS_INSTALL_GATE;

export function useIsStandalone(): boolean {
  if (BYPASS === 'true' || BYPASS === '1') return true;
  if ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

export function InstallGate() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="install-gate">
      <div className="install-gate__title">Install required</div>
      <div className="install-gate__body">Add this app to your home screen to use it.</div>

      {isIOS && (
        <div className="install-steps">
          <div className="install-step">
            <div className="install-step__num">1</div>
            <div className="install-step__text">Tap the Share button in Safari</div>
          </div>
          <div className="install-step">
            <div className="install-step__num">2</div>
            <div className="install-step__text">Tap "Add to Home Screen"</div>
          </div>
          <div className="install-step">
            <div className="install-step__num">3</div>
            <div className="install-step__text">Open the app from your home screen</div>
          </div>
        </div>
      )}

      {isAndroid && (
        <div className="install-steps">
          <div className="install-step">
            <div className="install-step__num">1</div>
            <div className="install-step__text">Tap the browser menu</div>
          </div>
          <div className="install-step">
            <div className="install-step__num">2</div>
            <div className="install-step__text">Tap "Add to Home screen"</div>
          </div>
          <div className="install-step">
            <div className="install-step__num">3</div>
            <div className="install-step__text">Open from your home screen</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
        Requires iOS 16.4+ or Chrome on Android
      </div>
    </div>
  );
}
