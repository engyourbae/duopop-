import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatKind, ChatMsg, Scope } from '../../services/chat';
import { serverNow } from '../../utils/clock';

const MAX_LOCAL = 150;
const keyOf = (s: Scope) => `duopop:chat:${s.kind}:${s.id}`;
const load = (s: Scope | null): ChatMsg[] => { if (!s) return []; try { return JSON.parse(localStorage.getItem(keyOf(s)) ?? '[]') as ChatMsg[]; } catch { return []; } };
const save = (s: Scope, m: ChatMsg[]) => { try { localStorage.setItem(keyOf(s), JSON.stringify(m.slice(-MAX_LOCAL))); } catch { /* penyimpanan penuh */ } };

/** Hook chat: pesan teks disimpan lokal; reaksi/stiker hanya menjadi "peristiwa" sementara untuk animasi. */
export function useChat(scope: Scope | null, me: { uid: string; displayName: string } | null, panelOpen: boolean) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => load(scope));
  const [events, setEvents] = useState<ChatMsg[]>([]);
  const [unread, setUnread] = useState(0);
  const seen = useRef<Set<string>>(new Set(load(scope).map((m) => m.id)));
  const open = useRef(panelOpen); open.current = panelOpen;
  const sid = scope ? `${scope.kind}:${scope.id}` : '';
  useEffect(() => {
    if (!scope || !me) return;
    setMsgs(load(scope)); seen.current = new Set(load(scope).map((m) => m.id));
    let off: (() => void) | undefined, dead = false;
    void import('../../services/chat').then((c) => {
      if (dead) return;
      off = c.watchChat(scope, (batch) => {
        const fresh = batch.filter((m) => !seen.current.has(m.id));
        if (!fresh.length) return;
        fresh.forEach((m) => seen.current.add(m.id));
        const texts = fresh.filter((m) => m.kind === 'text'), fx = fresh.filter((m) => m.kind !== 'text' && serverNow() - m.at < 8000);
        if (texts.length) { setMsgs((prev) => { const next = [...prev, ...texts]; save(scope, next); return next; }); if (!open.current) setUnread((n) => n + texts.filter((m) => m.uid !== me.uid).length); }
        if (fx.length) { setEvents((e) => [...e, ...fx]); setTimeout(() => setEvents((e) => e.filter((x) => !fx.includes(x))), 4200); }
      });
    }).catch(() => undefined);
    return () => { dead = true; off?.(); };
  }, [sid, me?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (panelOpen) setUnread(0); }, [panelOpen]);
  const last = useRef(0);
  const send = useCallback(async (kind: ChatKind, text: string): Promise<boolean> => {
    if (!scope || !me) return false;
    const gap = kind === 'text' ? 800 : 1200;
    if (Date.now() - last.current < gap) return false; // batas kecepatan di sisi klien
    last.current = Date.now();
    const c = await import('../../services/chat');
    await c.sendChat(scope, me, kind, text);
    return true;
  }, [sid, me?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const clear = useCallback(() => { if (scope) { try { localStorage.removeItem(keyOf(scope)); } catch { /* abaikan */ } setMsgs([]); } }, [sid]); // eslint-disable-line react-hooks/exhaustive-deps
  return { msgs, events, unread, send, clear };
}
