import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../../components/ui';
import { useCountdown } from '../../../hooks/useCountdown';
import { beep, sfx } from '../../../utils/sound';
import { STROOP } from '../logic';
import type { MechProps, Outcome } from './types';

/** Menjalankan game arkade satu pemain secara bergiliran untuk 1–4 pemain, lalu merangkum skor. */
function TurnRunner({ players, hint, xpPer, render, onDone }: { players: string[]; hint: string; xpPer: number; render: (end: (score: number) => void) => ReactNode; onDone: (o: Outcome) => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'play' | 'after'>('ready');
  const [scores, setScores] = useState<number[]>([]);
  const ended = useRef(false);
  const end = useCallback((s: number) => { if (ended.current) return; ended.current = true; setScores((p) => [...p, s]); setPhase('after'); }, []);
  const last = scores[scores.length - 1] ?? 0;
  if (phase === 'ready') return (
    <div className="card center gap"><div className="avatar" style={{ margin: '0 auto 8px' }}>{(players[i] ?? '?').slice(0, 1).toUpperCase()}</div>
      <h2>{players.length > 1 ? `Giliran ${players[i]}` : 'Siap?'}</h2><p className="muted">{hint}</p>
      <Button size="lg" onClick={() => { ended.current = false; setPhase('play'); }}>Mulai</Button></div>);
  if (phase === 'after') return (
    <div className="card center gap"><h2>Skor {players[i]}: {last}</h2>
      {i + 1 < players.length ? <Button size="lg" onClick={() => { setI(i + 1); setPhase('ready'); }}>Pemain berikutnya</Button>
        : <Button size="lg" onClick={() => { const best = Math.max(...scores); onDone({ scores, correct: players.length, total: players.length, xp: Math.min(100, Math.round(best * xpPer) + 10), headline: `Skor tertinggi: ${best}` }); }}>Lihat hasil</Button>}
      {players.length > 1 && scores.map((s, k) => <div key={k} className="score-row"><span>{players[k]}</span><span>{s}</span></div>)}</div>);
  return <div key={`p${i}`}>{render(end)}</div>;
}

const cssVar = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#000';

// ---------- Pukul Tikus ----------
function Whack({ secs, end }: { secs: number; end: (s: number) => void }) {
  const [score, setScore] = useState(0);
  const [mole, setMole] = useState<number | null>(null);
  const left = useCountdown(secs, 'whack', true, () => end(score));
  useEffect(() => {
    let alive = true, t: ReturnType<typeof setTimeout>;
    const t0 = Date.now();
    const spawn = () => {
      if (!alive) return;
      setMole((m) => { let n = Math.floor(Math.random() * 9); if (n === m) n = (n + 1) % 9; return n; });
      const speed = Math.max(420, 900 - (Date.now() - t0) / 40);
      t = setTimeout(() => { setMole(null); t = setTimeout(spawn, 160); }, speed);
    };
    t = setTimeout(spawn, 400);
    return () => { alive = false; clearTimeout(t); };
  }, []);
  const hit = (i: number) => { if (i === mole) { setScore((s) => s + 1); setMole(null); sfx.right(); } };
  return (
    <div><div className="row" style={{ justifyContent: 'space-between' }}><b>Skor: {score}</b><b>{Math.ceil(left)} dtk</b></div>
      <div className="holes">{Array.from({ length: 9 }, (_, i) => (
        <button key={i} className="hole" onPointerDown={() => hit(i)} aria-label={`Lubang ${i + 1}`}>
          {mole === i && <svg viewBox="0 0 60 60" width="64" height="64" aria-hidden="true"><circle cx="30" cy="34" r="22" fill="#8a5a2b" stroke="#17140e" strokeWidth="3" /><circle cx="22" cy="30" r="3.5" fill="#17140e" /><circle cx="38" cy="30" r="3.5" fill="#17140e" /><ellipse cx="30" cy="39" rx="5" ry="3.5" fill="#ff9ec0" stroke="#17140e" strokeWidth="2" /></svg>}
        </button>))}</div></div>
  );
}
export function WhackMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={2} hint={`Ketuk tikus secepatnya. Waktu ${p.secs} detik.`} onDone={p.onDone} render={(end) => <Whack secs={p.secs} end={end} />} />; }

// ---------- Tebak Warna (Stroop) ----------
function Stroop({ secs, end }: { secs: number; end: (s: number) => void }) {
  const mk = () => { const w = Math.floor(Math.random() * 4); const c = Math.random() < 0.75 ? (w + 1 + Math.floor(Math.random() * 3)) % 4 : w; return { w, c }; };
  const [score, setScore] = useState(0);
  const [q, setQ] = useState(mk);
  const [flash, setFlash] = useState<'' | 'ok' | 'bad'>('');
  const left = useCountdown(secs, 'stroop', true, () => end(score));
  const pick = (i: number) => {
    const ok = i === q.c;
    setScore((s) => (ok ? s + 1 : Math.max(0, s - 1))); setFlash(ok ? 'ok' : 'bad'); (ok ? sfx.right : sfx.wrong)();
    setTimeout(() => setFlash(''), 220); setQ(mk());
  };
  return (
    <div><div className="row" style={{ justifyContent: 'space-between' }}><b>Skor: {score}</b><b>{Math.ceil(left)} dtk</b></div>
      <p className="center muted small gap">Pilih WARNA TINTA kata ini:</p>
      <div className={`qbox stroop ${flash}`} style={{ color: STROOP[q.c]?.color, fontSize: '2.6rem', padding: '36px 16px' }}>{STROOP[q.w]?.name}</div>
      <div className="grid">{STROOP.map((s, i) => <button key={s.name} className="swatch" style={{ background: s.color }} onPointerDown={() => pick(i)} aria-label={s.name.toLowerCase()} />)}</div></div>
  );
}
export function StroopMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={3} hint="Abaikan arti katanya, pilih warna tintanya!" onDone={p.onDone} render={(end) => <Stroop secs={p.secs} end={end} />} />; }

// ---------- Ikuti Urutan (Simon) ----------
const PADS = [{ c: '#e0401f', f: 262 }, { c: '#2a4bff', f: 330 }, { c: '#ffc414', f: 392 }, { c: '#0f8f5f', f: 523 }];
function Simon({ end }: { end: (s: number) => void }) {
  const [seq, setSeq] = useState<number[]>(() => [Math.floor(Math.random() * 4)]);
  const [phase, setPhase] = useState<'watch' | 'repeat' | 'over'>('watch');
  const [lit, setLit] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (phase !== 'watch') return;
    const ts: ReturnType<typeof setTimeout>[] = [];
    seq.forEach((p, k) => {
      ts.push(setTimeout(() => { setLit(p); beep(PADS[p]?.f ?? 300, 0.3); }, 700 + k * 650));
      ts.push(setTimeout(() => setLit(null), 700 + k * 650 + 380));
    });
    ts.push(setTimeout(() => { setPhase('repeat'); setPos(0); }, 700 + seq.length * 650));
    return () => ts.forEach(clearTimeout);
  }, [phase, seq]);
  const press = (i: number) => {
    if (phase !== 'repeat') return;
    setLit(i); beep(PADS[i]?.f ?? 300, 0.25); setTimeout(() => setLit(null), 200);
    if (i !== seq[pos]) { setPhase('over'); sfx.wrong(); setTimeout(() => end(seq.length - 1), 1000); return; }
    if (pos + 1 === seq.length) { setPhase('watch'); setTimeout(() => setSeq((s) => [...s, Math.floor(Math.random() * 4)]), 500); } else setPos(pos + 1);
  };
  return (
    <div className="center"><b>Level {seq.length}</b><p className="muted small">{phase === 'watch' ? 'Perhatikan…' : phase === 'repeat' ? 'Giliranmu!' : 'Salah urutan!'}</p>
      <div className="simon">{PADS.map((p, i) => <button key={i} className={`spad ${lit === i ? 'lit' : ''}`} style={{ background: p.c }} onPointerDown={() => press(i)} aria-label={`Pad ${i + 1}`} />)}</div></div>
  );
}
export function SimonMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={8} hint="Hafalkan urutan nyala warna, lalu ulangi." onDone={p.onDone} render={(end) => <Simon end={end} />} />; }

// ---------- Ular Lapar ----------
const N = 15, CELL = 20;
function Snake({ end }: { end: (s: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ body: [[7, 7], [6, 7], [5, 7]] as number[][], dir: [1, 0], next: [1, 0], food: [11, 7], score: 0, dead: false });
  const [score, setScore] = useState(0);
  const turn = (dx: number, dy: number) => { const s = st.current; if (dx !== -s.dir[0]! || dy !== -s.dir[1]!) s.next = [dx, dy]; };
  useEffect(() => {
    const ctx = cv.current?.getContext('2d');
    if (!ctx) return;
    const S = st.current;
    const bg = cssVar('--card'), ink = cssVar('--ink'), green = cssVar('--green'), red = cssVar('--red');
    const draw = () => {
      const s = st.current;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, N * CELL, N * CELL);
      ctx.fillStyle = red; ctx.fillRect(s.food[0]! * CELL + 2, s.food[1]! * CELL + 2, CELL - 4, CELL - 4);
      s.body.forEach((b, i) => { ctx.fillStyle = i === 0 ? ink : green; ctx.fillRect(b[0]! * CELL + 1, b[1]! * CELL + 1, CELL - 2, CELL - 2); });
    };
    const tick = () => {
      const s = st.current; if (s.dead) return;
      s.dir = s.next;
      const h: number[] = [s.body[0]![0]! + s.dir[0]!, s.body[0]![1]! + s.dir[1]!];
      if (h[0]! < 0 || h[1]! < 0 || h[0]! >= N || h[1]! >= N || s.body.some((b) => b[0] === h[0] && b[1] === h[1])) { s.dead = true; sfx.wrong(); setTimeout(() => end(s.score), 700); return; }
      s.body.unshift(h);
      if (h[0] === s.food[0] && h[1] === s.food[1]) {
        s.score++; setScore(s.score); sfx.right();
        do { s.food = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; } while (s.body.some((b) => b[0] === s.food[0] && b[1] === s.food[1]));
      } else s.body.pop();
      draw();
    };
    draw();
    let id = setInterval(tick, 150), spd = 150;
    const sp = setInterval(() => { const want = Math.max(75, 150 - st.current.score * 4); if (want !== spd) { spd = want; clearInterval(id); id = setInterval(tick, spd); } }, 400);
    const key = (e: KeyboardEvent) => { const m: Record<string, number[]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }; const d = m[e.key]; if (d) { e.preventDefault(); turn(d[0]!, d[1]!); } };
    window.addEventListener('keydown', key);
    return () => { clearInterval(id); clearInterval(sp); window.removeEventListener('keydown', key); S.dead = true; };
  }, [end]);
  const sx = useRef<[number, number] | null>(null);
  return (
    <div className="center"><b>Skor: {score}</b>
      <canvas ref={cv} width={N * CELL} height={N * CELL} className="arcade-cv" style={{ touchAction: 'none' }}
        onPointerDown={(e) => { sx.current = [e.clientX, e.clientY]; }}
        onPointerUp={(e) => { if (!sx.current) return; const dx = e.clientX - sx.current[0], dy = e.clientY - sx.current[1]; sx.current = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1); }} />
      <p className="muted small">Geser di papan atau pakai tombol</p>
      <div className="dpad"><span /><button onClick={() => turn(0, -1)} aria-label="Atas">▲</button><span /><button onClick={() => turn(-1, 0)} aria-label="Kiri">◀</button><button onClick={() => turn(0, 1)} aria-label="Bawah">▼</button><button onClick={() => turn(1, 0)} aria-label="Kanan">▶</button></div></div>
  );
}
export function SnakeMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={4} hint="Makan apel, jangan menabrak!" onDone={p.onDone} render={(end) => <Snake end={end} />} />; }

// ---------- Terbang Melewati Pipa ----------
const FW = 300, FH = 440, BX = 80, GAP = 130, PW = 52;
function Flappy({ end }: { end: (s: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ y: 200, vy: 0, pipes: [] as { x: number; gy: number; passed: boolean }[], score: 0, started: false, dead: false });
  const [score, setScore] = useState(0);
  const flap = () => { const s = st.current; if (s.dead) return; s.started = true; s.vy = -6.4; beep(660, 0.05); };
  useEffect(() => {
    const ctx = cv.current?.getContext('2d');
    if (!ctx) return;
    const S = st.current;
    const bg = cssVar('--card'), ink = cssVar('--ink'), green = cssVar('--green'), yellow = cssVar('--yellow');
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const s = st.current, k = Math.min(2, (now - last) / 16.67); last = now;
      if (s.started && !s.dead) {
        s.vy += 0.34 * k; s.y += s.vy * k;
        if (!s.pipes.length || (s.pipes[s.pipes.length - 1]?.x ?? 0) < FW - 175) s.pipes.push({ x: FW + 10, gy: 90 + Math.random() * (FH - 180 - GAP + 60), passed: false });
        s.pipes.forEach((p) => { p.x -= 2.3 * k; if (!p.passed && p.x + PW < BX - 12) { p.passed = true; s.score++; setScore(s.score); sfx.right(); } });
        s.pipes = s.pipes.filter((p) => p.x > -PW - 5);
        const hit = s.y < 12 || s.y > FH - 12 || s.pipes.some((p) => BX + 12 > p.x && BX - 12 < p.x + PW && (s.y - 12 < p.gy || s.y + 12 > p.gy + GAP));
        if (hit) { s.dead = true; sfx.wrong(); setTimeout(() => end(s.score), 700); }
      } else if (!s.started) s.y = 200 + Math.sin(now / 250) * 8;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, FW, FH);
      ctx.fillStyle = green; ctx.strokeStyle = ink; ctx.lineWidth = 3;
      s.pipes.forEach((p) => { ctx.fillRect(p.x, 0, PW, p.gy); ctx.strokeRect(p.x, 0, PW, p.gy); ctx.fillRect(p.x, p.gy + GAP, PW, FH); ctx.strokeRect(p.x, p.gy + GAP, PW, FH); });
      ctx.fillStyle = yellow; ctx.beginPath(); ctx.arc(BX, s.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(BX + 4, s.y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const key = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); flap(); } };
    window.addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', key); S.dead = true; };
  }, [end]);
  return (
    <div className="center"><b>Skor: {score}</b>
      <canvas ref={cv} width={FW} height={FH} className="arcade-cv" style={{ touchAction: 'none' }} onPointerDown={flap} />
      <p className="muted small">Ketuk layar untuk mengepak</p></div>
  );
}
export function FlappyMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={6} hint="Ketuk untuk melompat, lolos dari pipa." onDone={p.onDone} render={(end) => <Flappy end={end} />} />; }

// ---------- Tangkap Bintang ----------
const CW = 300, CH = 420;
function Catch({ secs, end }: { secs: number; end: (s: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ x: CW / 2, items: [] as { x: number; y: number; bomb: boolean }[], score: 0, lives: 3, spawn: 0, t: 0, done: false, left: false, right: false });
  const [hud, setHud] = useState({ score: 0, lives: 3, t: secs });
  const mv = (clientX: number) => { const r = cv.current?.getBoundingClientRect(); if (r) st.current.x = Math.max(30, Math.min(CW - 30, ((clientX - r.left) / r.width) * CW)); };
  useEffect(() => {
    const ctx = cv.current?.getContext('2d');
    if (!ctx) return;
    const S = st.current;
    const bg = cssVar('--card'), ink = cssVar('--ink'), yellow = cssVar('--yellow'), red = cssVar('--red');
    let raf = 0, last = performance.now();
    const finish = () => { const s = st.current; if (s.done) return; s.done = true; setTimeout(() => end(s.score), 500); };
    const loop = (now: number) => {
      const s = st.current, dt = Math.min(0.05, (now - last) / 1000), k = dt * 60; last = now;
      if (!s.done) {
        s.t += dt; if (s.left) s.x = Math.max(30, s.x - 6 * k); if (s.right) s.x = Math.min(CW - 30, s.x + 6 * k);
        s.spawn -= dt;
        if (s.spawn <= 0) { s.items.push({ x: 15 + Math.random() * (CW - 30), y: -10, bomb: Math.random() < 0.22 }); s.spawn = Math.max(0.35, 0.8 - s.t * 0.01); }
        const sp = (2.4 + s.score * 0.04) * k;
        s.items.forEach((it) => { it.y += sp; });
        s.items = s.items.filter((it) => {
          if (it.y > CH - 38 && it.y < CH - 8 && Math.abs(it.x - s.x) < 36) {
            if (it.bomb) { s.lives--; sfx.wrong(); } else { s.score++; sfx.right(); }
            setHud({ score: s.score, lives: s.lives, t: Math.max(0, secs - s.t) }); return false;
          }
          return it.y < CH + 12;
        });
        if (s.lives <= 0 || s.t >= secs) finish();
        setHud((h) => (Math.abs(h.t - (secs - s.t)) > 0.5 ? { ...h, t: Math.max(0, secs - s.t) } : h));
      }
      ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);
      s.items.forEach((it) => { ctx.fillStyle = it.bomb ? ink : yellow; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(it.x, it.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (it.bomb) { ctx.fillStyle = red; ctx.fillRect(it.x - 2, it.y - 14, 4, 6); } });
      ctx.fillStyle = red; ctx.strokeStyle = ink; ctx.fillRect(s.x - 30, CH - 30, 60, 22); ctx.strokeRect(s.x - 30, CH - 30, 60, 22);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const kd = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') st.current.left = e.type === 'keydown'; if (e.key === 'ArrowRight') st.current.right = e.type === 'keydown'; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', kd);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', kd); S.done = true; };
  }, [end, secs]);
  return (
    <div className="center"><div className="row" style={{ justifyContent: 'space-between' }}><b>Skor: {hud.score}</b><b>Nyawa: {'♥'.repeat(Math.max(0, hud.lives))}</b><b>{Math.ceil(hud.t)} dtk</b></div>
      <canvas ref={cv} width={CW} height={CH} className="arcade-cv" style={{ touchAction: 'none' }} onPointerMove={(e) => mv(e.clientX)} onPointerDown={(e) => mv(e.clientX)} />
      <p className="muted small">Geser jari untuk menggerakkan keranjang · bulat gelap = bom</p></div>
  );
}
export function CatchMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={3} hint="Tangkap bintang kuning, hindari bom hitam." onDone={p.onDone} render={(end) => <Catch secs={p.secs} end={end} />} />; }
