import { useEffect, useRef, useState } from 'react';
import { Button, Modal, useToast } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { explainError } from '../../utils/errors';
import type { Scope } from '../../services/chat';
import { useChat } from './useChat';

export const EMOTES = ['👍', '😂', '😮', '🔥', '❤️', '👏', '🎉', '😭', '🤔', '😎'];
/** Stiker kustom datar (bukan emoji) — dirender dari data agar konsisten dengan desain. */
export const STICKERS: { id: string; label: string; bg: string; fg: string; icon: string; rot: number }[] = [
  { id: 'gg', label: 'GG!', bg: '#2a4bff', fg: '#fff', icon: 'trophy', rot: -4 }, { id: 'mantap', label: 'Mantap!', bg: '#ffc414', fg: '#17140e', icon: 'star', rot: 3 },
  { id: 'wkwk', label: 'Wkwk', bg: '#ff9ec0', fg: '#17140e', icon: 'sparkle', rot: -3 }, { id: 'awas', label: 'Awas!', bg: '#e0401f', fg: '#fff', icon: 'bolt', rot: 4 },
  { id: 'sabar', label: 'Sabar ya', bg: '#0f8f5f', fg: '#fff', icon: 'heart', rot: -2 }, { id: 'ayo', label: 'Ayo!', bg: '#f2eadb', fg: '#17140e', icon: 'fire', rot: 3 },
  { id: 'hebat', label: 'Hebat!', bg: '#2a4bff', fg: '#fff', icon: 'check', rot: 2 }, { id: 'yah', label: 'Yaaah…', bg: '#6a6252', fg: '#fff', icon: 'x', rot: -3 },
  { id: 'wow', label: 'Wow!', bg: '#ffc414', fg: '#17140e', icon: 'sun', rot: -4 }, { id: 'siap', label: 'Siap!', bg: '#0f8f5f', fg: '#fff', icon: 'flag', rot: 3 },
  { id: 'rematch', label: 'Sekali lagi!', bg: '#e0401f', fg: '#fff', icon: 'repeat', rot: -2 }, { id: 'lanjut', label: 'Lanjut', bg: '#ff9ec0', fg: '#17140e', icon: 'play', rot: 2 },
];
export function Sticker({ id, size = 1 }: { id: string; size?: number }) {
  const s = STICKERS.find((x) => x.id === id);
  if (!s) return <span>{id}</span>;
  return <span className="sticker" style={{ background: s.bg, color: s.fg, transform: `rotate(${s.rot}deg) scale(${size})` }}><Icon name={s.icon} size={18} />{s.label}</span>;
}

/** Bilah reaksi + tombol chat + lapisan animasi reaksi. Semua sementara (relay), tidak disimpan di database. */
export function Social({ scope, me, title, floating = true }: { scope: Scope; me: { uid: string; displayName: string }; title: string; floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [stick, setStick] = useState(false);
  const { msgs, events, unread, send, clear } = useChat(scope, me, open);
  const toast = useToast();
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) end.current?.scrollIntoView?.({ block: 'end' }); }, [msgs.length, open]);
  const fire = async (kind: 'react' | 'sticker', v: string) => { try { await send(kind, v); } catch (e) { toast(explainError(e), 'err'); } };
  const submit = async () => { const t = text.trim(); if (!t) return; try { if (await send('text', t)) setText(''); } catch (e) { toast(explainError(e), 'err'); } };
  return (
    <>
      <div className="fx-layer" aria-hidden="true">{events.map((e) => <div key={e.id} className="fx-bubble" style={{ left: `${10 + (e.id.charCodeAt(0) * 7) % 70}%` }}>{e.kind === 'sticker' ? <Sticker id={e.text} size={1.4} /> : <span className="fx-emoji">{e.text}</span>}<small>{e.name}</small></div>)}</div>
      {!floating && <Button size="sm" variant="soft" icon="chat" onClick={() => setOpen(true)}>Chat{unread > 0 ? ` (${unread})` : ''}</Button>}
      {floating && (
        <div className="fx-bar">
          {EMOTES.slice(0, 6).map((em) => <button key={em} className="fx-btn" onClick={() => void fire('react', em)} aria-label={`Reaksi ${em}`}>{em}</button>)}
          <button className="fx-btn" onClick={() => setStick(true)} aria-label="Stiker"><Icon name="sparkle" size={20} /></button>
          <button className="fx-btn chat" onClick={() => setOpen(true)} aria-label="Chat"><Icon name="chat" size={20} />{unread > 0 && <b className="fx-dot">{unread}</b>}</button>
        </div>)}
      <Modal open={stick} title="Stiker & emote" onClose={() => setStick(false)}>
        <div className="row wrap">{EMOTES.map((em) => <button key={em} className="fx-btn big" onClick={() => { void fire('react', em); setStick(false); }}>{em}</button>)}</div>
        <div className="sticker-grid gap">{STICKERS.map((s) => <button key={s.id} className="sticker-btn" onClick={() => { void fire('sticker', s.id); setStick(false); }}><Sticker id={s.id} /></button>)}</div>
      </Modal>
      <Modal open={open} title={title} onClose={() => setOpen(false)}>
        <p className="small muted">Pesan hanya numpang lewat (hilang dari server dalam 60 detik) dan disimpan di perangkat ini.</p>
        <div className="chat-list" role="log" aria-live="polite">
          {msgs.length === 0 && <p className="muted center small">Belum ada pesan.</p>}
          {msgs.map((m) => <div key={m.id} className={`chat-msg ${m.uid === me.uid ? 'me' : ''}`}><small>{m.uid === me.uid ? 'Kamu' : m.name}</small><p>{m.text}</p></div>)}
          <div ref={end} />
        </div>
        <form className="row gap" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <input className="input" value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder="Tulis pesan…" aria-label="Pesan" />
          <Button type="submit" disabled={!text.trim()}>Kirim</Button>
        </form>
        {msgs.length > 0 && <button className="chip gap" onClick={clear}>Hapus riwayat lokal</button>}
      </Modal>
    </>
  );
}
