import { createClient } from 'npm:@supabase/supabase-js@2';
// @ts-ignore
import webpush from 'npm:web-push@3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@pickmeup.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: PingRecord;
  old_record?: PingRecord;
}

interface PingRecord {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  status: 'pending' | 'acknowledged' | 'done';
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
  role: string;
}

function buildNotification(event: 'new_ping' | 'status_update', ping: PingRecord) {
  if (event === 'new_ping') {
    return {
      title: 'Pickup request',
      body: ping.note ? `${ping.user_name}: "${ping.note}"` : `${ping.user_name} needs a pickup`,
      tag: `ping-${ping.id}`,
    };
  }
  const labels: Record<string, string> = { acknowledged: 'On the way', done: 'Done' };
  return {
    title: labels[ping.status] ?? ping.status,
    body: 'Your pickup request was updated',
    tag: `ping-status-${ping.id}`,
  };
}

async function sendToSubs(subs: PushSub[], notification: object) {
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(notification)
      )
    )
  );
  const expired: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const code = (r.reason as { statusCode?: number }).statusCode;
      if (code === 410 || code === 404) expired.push(subs[i].endpoint);
    }
  });
  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expired);
  }
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { type, record, old_record } = payload;

    if (type === 'INSERT') {
      const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('role', 'admin');
      if (subs?.length) await sendToSubs(subs as PushSub[], buildNotification('new_ping', record));
    }

    if (type === 'UPDATE' && old_record?.status !== record.status) {
      if (record.status === 'acknowledged' || record.status === 'done') {
        const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('role', 'passenger').eq('user_id', record.user_id);
        if (subs?.length) await sendToSubs(subs as PushSub[], buildNotification('status_update', record));
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
