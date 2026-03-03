import {
  createContext, useCallback, useContext, useEffect,
  useRef, useState, type ReactNode,
} from 'react';
import { dataStore } from '../store/supabaseStore';
import { registerPushSubscription, isPushSupported } from '../store/pushStore';
import type { AppUser, AuthState, Ping, Session } from '../types';

interface AppContextValue {
  auth: AuthState | null;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  users: AppUser[];
  sessions: Session[];
  pings: Ping[];
  activeSession: Session | null;
  createUser: (name: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createSession: (name: string) => Promise<void>;
  activateSession: (id: string) => Promise<void>;
  deactivateSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  createPing: (note?: string) => Promise<void>;
  updatePingStatus: (id: string, status: Ping['status']) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  myPingInActiveSession: Ping | null;
  pushEnabled: boolean;
  pushSupported: boolean;
  requestPush: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const AUTH_KEY = 'pickmeup_auth';
const POLL_INTERVAL = 10_000;

function loadAuth(): AuthState | null {
  try { return JSON.parse(sessionStorage.getItem(AUTH_KEY) ?? 'null'); }
  catch { return null; }
}

function saveAuth(a: AuthState | null) {
  if (a) sessionStorage.setItem(AUTH_KEY, JSON.stringify(a));
  else sessionStorage.removeItem(AUTH_KEY);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pings, setPings] = useState<Ping[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const mounted = useRef(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pushSupported = isPushSupported();

  const clearError = useCallback(() => setError(null), []);
  const handleError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err.message : 'Something went wrong');
  }, []);

  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    try {
      const [u, s, p, active] = await Promise.all([
        dataStore.getUsers(),
        dataStore.getSessions(),
        dataStore.getPings(),
        dataStore.getActiveSession(),
      ]);
      if (!mounted.current) return;
      setUsers(u); setSessions(s); setPings(p); setActiveSession(active);
    } catch (err) { handleError(err); }
  }, [handleError]);

  const silentRefresh = useCallback(async () => {
    if (!mounted.current) return;
    try {
      const [s, p, active] = await Promise.all([
        dataStore.getSessions(),
        dataStore.getPings(),
        dataStore.getActiveSession(),
      ]);
      if (!mounted.current) return;
      setSessions(s); setPings(p); setActiveSession(active);
    } catch { /* silent */ }
  }, []);

  // Initial load
  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    refresh().finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [refresh]);

  // Polling every 10s
  useEffect(() => {
    if (!auth) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(silentRefresh, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [auth, silentRefresh]);

  // Auto-prompt push on every login session
  useEffect(() => {
    if (!auth || !pushSupported) return;
    if (Notification.permission === 'granted') {
      setPushEnabled(true);
      registerPushSubscription(auth).catch(() => {});
      return;
    }
    if (Notification.permission === 'denied') return;
    // 'default' — prompt after short delay
    const t = setTimeout(async () => {
      const ok = await registerPushSubscription(auth);
      if (mounted.current) setPushEnabled(ok);
    }, 1500);
    return () => clearTimeout(t);
  }, [auth, pushSupported]);

  const requestPush = useCallback(async () => {
    if (!auth) return;
    if (!pushSupported) {
      setError('Notifications require the app installed on iPhone (iOS 16.4+). Open from the home screen.');
      return;
    }
    if (Notification.permission === 'denied') {
      setError('Notifications are blocked. Go to iPhone Settings → PickMeUp → Notifications to enable them.');
      return;
    }
    const ok = await registerPushSubscription(auth);
    if (mounted.current) {
      setPushEnabled(ok);
      if (!ok) setError('Could not enable notifications. Please try again.');
    }
  }, [auth, pushSupported]);

  const login = useCallback(async (code: string): Promise<boolean> => {
    try {
      setLoading(true); setError(null);
      const result = await dataStore.resolveLogin(code);
      if (result) { setAuth(result); saveAuth(result); await refresh(); return true; }
      setError('Invalid code. Please try again.');
      return false;
    } catch (err) { handleError(err); return false; }
    finally { setLoading(false); }
  }, [refresh, handleError]);

  const logout = useCallback(() => { setAuth(null); saveAuth(null); }, []);

  const createUser = useCallback(async (name: string) => {
    try { setError(null); await dataStore.createUser(name); await refresh(); }
    catch (err) { handleError(err); }
  }, [refresh, handleError]);

  const deleteUser = useCallback(async (id: string) => {
    try { setError(null); await dataStore.deleteUser(id); await refresh(); }
    catch (err) { handleError(err); }
  }, [refresh, handleError]);

  const createSession = useCallback(async (name: string) => {
    try { setError(null); await dataStore.createSession(name); await refresh(); }
    catch (err) { handleError(err); }
  }, [refresh, handleError]);

  const activateSession = useCallback(async (id: string) => {
    try { setError(null); await dataStore.activateSession(id); await refresh(); }
    catch (err) { handleError(err); }
  }, [refresh, handleError]);

  const deactivateSession = useCallback(async (id: string) => {
    try { setError(null); await dataStore.deactivateSession(id); await refresh(); }
    catch (err) { handleError(err); }
  }, [refresh, handleError]);

  const deleteSession = useCallback(async (id: string) => {
    try { setError(null); await dataStore.deleteSession(id); await refresh(); }
    catch (err) { handleError(err); }
  }, [refresh, handleError]);

  const createPing = useCallback(async (note?: string) => {
    if (!auth || auth.role !== 'passenger' || !auth.userId) {
      setError('Not authenticated as passenger.'); return;
    }
    if (!activeSession) { setError('No active session right now.'); return; }
    try {
      setError(null);
      await dataStore.createPing(activeSession.id, auth.userId, auth.userName!, note);
      await refresh();
    } catch (err) { handleError(err); }
  }, [auth, activeSession, refresh, handleError]);

  const updatePingStatus = useCallback(async (id: string, status: Ping['status']) => {
    try { setError(null); await dataStore.updatePingStatus(id, status); await refresh(); }
    catch (err) { handleError(err); }
  }, [refresh, handleError]);

  const myPingInActiveSession =
    auth?.role === 'passenger' && auth.userId && activeSession
      ? (pings.find(p => p.sessionId === activeSession.id && p.userId === auth.userId) ?? null)
      : null;

  return (
    <AppContext.Provider value={{
      auth, login, logout,
      users, sessions, pings, activeSession,
      createUser, deleteUser,
      createSession, activateSession, deactivateSession, deleteSession,
      createPing, updatePingStatus,
      loading, error, clearError, refresh,
      myPingInActiveSession,
      pushEnabled, pushSupported, requestPush,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
