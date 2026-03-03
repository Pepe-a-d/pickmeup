// ============================================================
// PickMeUp — localStorage DataStore (Phase 1)
// Full DataStore interface implementation backed by localStorage
// ============================================================

import { nanoid } from 'nanoid';
import type {
  AppUser,
  AuthState,
  DataStore,
  PersistedStore,
  Ping,
  PingStatus,
  Session,
} from '../types';

const STORAGE_KEY = 'pickmeup_v1';
const ADMIN_CODE = 'admin_pepe';
const SCHEMA_VERSION = 1;

// ─── Helpers ────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function generateUserCode(): string {
  // 6-character alphanumeric, uppercase — easy to type on mobile
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Store persistence ──────────────────────────────────────

function loadStore(): PersistedStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as PersistedStore;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      console.warn('[PickMeUp] Schema version mismatch — resetting store');
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function saveStore(store: PersistedStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function emptyStore(): PersistedStore {
  return {
    users: [],
    sessions: [],
    pings: [],
    schemaVersion: SCHEMA_VERSION,
  };
}

// ─── DataStore implementation ────────────────────────────────

class LocalStorageDataStore implements DataStore {
  // Internal store
  private get store(): PersistedStore {
    return loadStore();
  }

  private save(store: PersistedStore): void {
    saveStore(store);
  }

  // ── Users ────────────────────────────────────────────────

  async getUsers(): Promise<AppUser[]> {
    return [...this.store.users];
  }

  async createUser(name: string): Promise<AppUser> {
    const store = this.store;

    // Ensure code uniqueness
    let code: string;
    const existingCodes = new Set(store.users.map((u) => u.code));
    existingCodes.add(ADMIN_CODE); // Never collide with admin
    do {
      code = generateUserCode();
    } while (existingCodes.has(code));

    const user: AppUser = {
      id: nanoid(),
      name: name.trim(),
      code,
      createdAt: now(),
    };

    store.users.push(user);
    this.save(store);
    return { ...user };
  }

  async deleteUser(id: string): Promise<void> {
    const store = this.store;
    store.users = store.users.filter((u) => u.id !== id);
    // Also remove their pings
    store.pings = store.pings.filter((p) => p.userId !== id);
    this.save(store);
  }

  // ── Sessions ─────────────────────────────────────────────

  async getSessions(): Promise<Session[]> {
    return [...this.store.sessions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createSession(name: string): Promise<Session> {
    const store = this.store;
    const session: Session = {
      id: nanoid(),
      name: name.trim(),
      isActive: false,
      createdAt: now(),
    };
    store.sessions.push(session);
    this.save(store);
    return { ...session };
  }

  async activateSession(id: string): Promise<Session> {
    const store = this.store;
    // Deactivate all others first
    store.sessions = store.sessions.map((s) => ({
      ...s,
      isActive: false,
      closedAt: s.isActive && s.id !== id ? now() : s.closedAt,
    }));
    // Activate the target
    const idx = store.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Session not found');
    store.sessions[idx] = {
      ...store.sessions[idx],
      isActive: true,
      closedAt: undefined,
    };
    this.save(store);
    return { ...store.sessions[idx] };
  }

  async deactivateSession(id: string): Promise<Session> {
    const store = this.store;
    const idx = store.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Session not found');
    store.sessions[idx] = {
      ...store.sessions[idx],
      isActive: false,
      closedAt: now(),
    };
    this.save(store);
    return { ...store.sessions[idx] };
  }

  async deleteSession(id: string): Promise<void> {
    const store = this.store;
    store.sessions = store.sessions.filter((s) => s.id !== id);
    // Cascade delete pings
    store.pings = store.pings.filter((p) => p.sessionId !== id);
    this.save(store);
  }

  async getActiveSession(): Promise<Session | null> {
    const active = this.store.sessions.find((s) => s.isActive);
    return active ? { ...active } : null;
  }

  // ── Pings ────────────────────────────────────────────────

  async getPings(sessionId?: string): Promise<Ping[]> {
    const pings = this.store.pings;
    const filtered = sessionId ? pings.filter((p) => p.sessionId === sessionId) : pings;
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createPing(
    sessionId: string,
    userId: string,
    userName: string,
    note?: string
  ): Promise<Ping> {
    const store = this.store;

    // Atomic guard: one ping per user per session
    const alreadyPinged = store.pings.some(
      (p) => p.sessionId === sessionId && p.userId === userId
    );
    if (alreadyPinged) {
      throw new Error('You have already requested a pickup for this session.');
    }

    // Guard: session must be active
    const session = store.sessions.find((s) => s.id === sessionId);
    if (!session?.isActive) {
      throw new Error('No active session. Cannot request pickup.');
    }

    const ping: Ping = {
      id: nanoid(),
      sessionId,
      userId,
      userName,
      status: 'pending',
      note,
      createdAt: now(),
      updatedAt: now(),
    };

    store.pings.push(ping);
    this.save(store);
    return { ...ping };
  }

  async updatePingStatus(id: string, status: PingStatus): Promise<Ping> {
    const store = this.store;
    const idx = store.pings.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Ping not found');
    store.pings[idx] = {
      ...store.pings[idx],
      status,
      updatedAt: now(),
    };
    this.save(store);
    return { ...store.pings[idx] };
  }

  async hasPingedInSession(sessionId: string, userId: string): Promise<boolean> {
    return this.store.pings.some(
      (p) => p.sessionId === sessionId && p.userId === userId
    );
  }

  // ── Auth ─────────────────────────────────────────────────

  async resolveLogin(code: string): Promise<AuthState | null> {
    const trimmed = code.trim();

    // Admin
    if (trimmed === ADMIN_CODE) {
      return { role: 'admin' };
    }

    // Passenger — find matching user
    const user = this.store.users.find((u) => u.code === trimmed);
    if (user) {
      return {
        role: 'passenger',
        userId: user.id,
        userName: user.name,
      };
    }

    return null;
  }
}

// ─── Singleton export ───────────────────────────────────────

export const dataStore: DataStore = new LocalStorageDataStore();
