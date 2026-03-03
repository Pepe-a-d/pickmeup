export type UserRole = 'admin' | 'passenger';

export interface AppUser {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  closedAt?: string;
}

export type PingStatus = 'pending' | 'acknowledged' | 'done';

export interface Ping {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  status: PingStatus;
  note?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  role: UserRole;
  userId?: string;
  userName?: string;
}

export interface DataStore {
  getUsers(): Promise<AppUser[]>;
  createUser(name: string): Promise<AppUser>;
  deleteUser(id: string): Promise<void>;
  getSessions(): Promise<Session[]>;
  createSession(name: string): Promise<Session>;
  activateSession(id: string): Promise<Session>;
  deactivateSession(id: string): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  getActiveSession(): Promise<Session | null>;
  getPings(sessionId?: string): Promise<Ping[]>;
  createPing(sessionId: string, userId: string, userName: string, note?: string, lat?: number, lng?: number): Promise<Ping>;
  updatePingStatus(id: string, status: PingStatus): Promise<Ping>;
  hasPingedInSession(sessionId: string, userId: string): Promise<boolean>;
  resolveLogin(code: string): Promise<AuthState | null>;
}
