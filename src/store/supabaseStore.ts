import { createClient } from '@supabase/supabase-js';
import type { AppUser, AuthState, DataStore, Ping, PingStatus, Session } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const ADMIN_CODE = (import.meta.env.VITE_ADMIN_CODE as string) ?? 'ADMIN';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function now() { return new Date().toISOString(); }

function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function assertOk<T>(data: T | null, error: unknown, ctx: string): T {
  if (error) throw new Error(`[${ctx}] ${(error as { message?: string }).message ?? String(error)}`);
  if (data === null) throw new Error(`[${ctx}] No data returned`);
  return data;
}

interface UserRow { id: string; name: string; code: string; created_at: string; }
interface SessionRow { id: string; name: string; is_active: boolean; created_at: string; closed_at: string | null; }
interface PingRow { id: string; session_id: string; user_id: string; user_name: string; status: PingStatus; note: string | null; lat: number | null; lng: number | null; created_at: string; updated_at: string; }

const mapUser = (r: UserRow): AppUser => ({ id: r.id, name: r.name, code: r.code, createdAt: r.created_at });
const mapSession = (r: SessionRow): Session => ({ id: r.id, name: r.name, isActive: r.is_active, createdAt: r.created_at, closedAt: r.closed_at ?? undefined });
const mapPing = (r: PingRow): Ping => ({ id: r.id, sessionId: r.session_id, userId: r.user_id, userName: r.user_name, status: r.status, note: r.note ?? undefined, lat: r.lat ?? undefined, lng: r.lng ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at });

class SupabaseDataStore implements DataStore {
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    return assertOk(data, error, 'getUsers').map(r => mapUser(r as UserRow));
  }

  async createUser(name: string) {
    let code = '';
    let attempts = 0;
    while (true) {
      code = generateUserCode();
      const { data } = await supabase.from('users').select('id').eq('code', code).maybeSingle();
      if (!data) break;
      if (++attempts > 20) throw new Error('Could not generate unique code');
    }
    const { data, error } = await supabase.from('users').insert({ name: name.trim(), code }).select().single();
    return mapUser(assertOk(data, error, 'createUser') as UserRow);
  }

  async deleteUser(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getSessions() {
    const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
    return assertOk(data, error, 'getSessions').map(r => mapSession(r as SessionRow));
  }

  async createSession(name: string) {
    const { data, error } = await supabase.from('sessions').insert({ name: name.trim() }).select().single();
    return mapSession(assertOk(data, error, 'createSession') as SessionRow);
  }

  async activateSession(id: string) {
    await supabase.from('sessions').update({ is_active: false, closed_at: now() }).eq('is_active', true).neq('id', id);
    const { data, error } = await supabase.from('sessions').update({ is_active: true, closed_at: null }).eq('id', id).select().single();
    return mapSession(assertOk(data, error, 'activateSession') as SessionRow);
  }

  async deactivateSession(id: string) {
    const { data, error } = await supabase.from('sessions').update({ is_active: false, closed_at: now() }).eq('id', id).select().single();
    return mapSession(assertOk(data, error, 'deactivateSession') as SessionRow);
  }

  async deleteSession(id: string) {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getActiveSession() {
    const { data, error } = await supabase.from('sessions').select('*').eq('is_active', true).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapSession(data as SessionRow) : null;
  }

  async getPings(sessionId?: string) {
    let q = supabase.from('pings').select('*').order('created_at', { ascending: false });
    if (sessionId) q = q.eq('session_id', sessionId);
    const { data, error } = await q;
    return assertOk(data, error, 'getPings').map(r => mapPing(r as PingRow));
  }

  async createPing(sessionId: string, userId: string, userName: string, note?: string, lat?: number, lng?: number) {
    const { data, error } = await supabase.rpc('create_ping', {
      p_session_id: sessionId, p_user_id: userId, p_user_name: userName, p_note: note ?? null,
      p_lat: lat ?? null, p_lng: lng ?? null,
    });
    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) throw new Error('You already requested a pickup for this session.');
      if (error.message.includes('not active')) throw new Error('No active session.');
      throw new Error(error.message);
    }
    return mapPing(data as PingRow);
  }

  async updatePingStatus(id: string, status: PingStatus) {
    const { data, error } = await supabase.from('pings').update({ status, updated_at: now() }).eq('id', id).select().single();
    return mapPing(assertOk(data, error, 'updatePingStatus') as PingRow);
  }

  async hasPingedInSession(sessionId: string, userId: string) {
    const { data } = await supabase.from('pings').select('id').eq('session_id', sessionId).eq('user_id', userId).maybeSingle();
    return !!data;
  }

  async resolveLogin(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === ADMIN_CODE.toUpperCase()) return { role: 'admin' as const };
    const { data, error } = await supabase.from('users').select('id, name').eq('code', trimmed).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as { id: string; name: string };
    return { role: 'passenger' as const, userId: row.id, userName: row.name };
  }
}

export const dataStore: DataStore = new SupabaseDataStore();
