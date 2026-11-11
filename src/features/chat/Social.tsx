import { useEffect, useRef, useState } from 'react';
import { Button, Modal, useToast } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { explainError } from '../../utils/errors';
import type { Scope } from '../../services/chat';
import { useChat } from './useChat';
import { CUSTOM_REACTS, CustomReact, EMOTES, FxLayer, NativeEmoji, ReactSheet } from './Fx';

export { EMOTES, STICKERS, Sticker } from './Fx';

/** Bilah reaksi + tombol chat + lapisan animasi reaksi. Semua sementara (relay), tidak disimpan di database. */
export function Social({ scope, me, title, floating = true }: { scope: Scope; me: { uid: string; displayName: string }; title: string; floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [stick, setStick] = useState(false);
  const { msgs, events, unread, send, clear } = useChat(scope, me, open);
  const toast = useToast();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  // selalu gulung ke pesan terbaru (bawah) di dalam daftar chat saja, bukan seluruh halaman
  useEffect(() => { if (!open) return; const go = () => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }; go(); const id = requestAnimationFrame(go); return () => cancelAnimationFrame(id); }, [msgs.length, open]);
  const fire = async (kind: 'react' | 'sticker', v: string) => { try { await send(kind, v); } catch (e) { toast(explainError(e), 'err'); } };
  const submit = async () => { const t = text.trim(); if (!t) return; try { if (await send('text', t)) setText(''); } catch (e) { toast(explainError(e), 'err'); } };
  return (
    <>
      <FxLayer events={events} />
      {!floating && <Button size="sm" variant="soft" icon="chat" onClick={() => setOpen(true)}>Chat{unread > 0 ? ` (${unread})` : ''}</Button>}
      {floating && (
        <div className="fx-bar">
          {EMOTES.slice(0, 5).map((em) => <button key={em} className="fx-btn" onClick={() => void fire('react', em)} aria-label={`Reaksi ${em}`}><NativeEmoji t={em} /></button>)}
          <button className="fx-btn" onClick={() => void fire('sticker', CUSTOM_REACTS[0].id)} aria-label={`Reaksi ${CUSTOM_REACTS[0].label}`}><CustomReact id={CUSTOM_REACTS[0].id} size={28} /></button>
          <button className="fx-btn" onClick={() => setStick(true)} aria-label="Stiker"><Icon name="sparkle" size={20} /></button>
          <button className="fx-btn chat" onClick={() => setOpen(true)} aria-label="Chat"><Icon name="chat" size={20} />{unread > 0 && <b className="fx-dot">{unread}</b>}</button>
        </div>)}
      <ReactSheet open={stick} onClose={() => setStick(false)} onFire={(k, v) => void fire(k, v)} />
      <Modal open={open} title={title} onClose={() => setOpen(false)}>
        <p className="small muted">Pesan hanya numpang lewat (hilang dari server dalam 60 detik) dan disimpan di perangkat ini.</p>
        <div className="chat-list" ref={listRef} role="log" aria-live="polite">
          {msgs.length === 0 && <p className="muted center small">Belum ada pesan.</p>}
          {msgs.map((m) => <div key={m.id} className={`chat-msg ${m.uid === me.uid ? 'me' : ''}`}><small>{m.uid === me.uid ? 'Kamu' : m.name}</small><p>{m.text}</p></div>)}
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
