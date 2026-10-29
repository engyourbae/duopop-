import { makeDeck, uno, playable, playMove, MOVE_DRAW, MOVE_PASS, cardColor, cardVal } from '../features/games/engines/uno';
import { gaple, hasMove, playMove as gm, MOVE_PASS as GP, tile, pips, canPlay as canPlayG } from '../features/games/engines/gaple';
import { ladder, diceFor, JUMPS } from '../features/games/engines/ladder';
import { replayTurns } from '../features/games/engines/types';

describe('UNO', () => {
  it('dek 108 kartu dan pembagian 7 kartu', () => {
    expect(makeDeck().length).toBe(108);
    const s = uno.init(4, 'x'); expect(s.hands.every((h) => h.length === 7)).toBe(true);
    expect(s.hands.flat().length + s.draw.length + s.discard.length).toBe(108); expect(s.discard.length).toBe(1);
    expect(uno.init(4, 'x')).toEqual(uno.init(4, 'x')); expect(uno.init(4, 'y')).not.toEqual(uno.init(4, 'x'));
  });
  it('langkah sah/tidak sah dan perpindahan giliran', () => {
    let s = uno.init(3, 'seed1');
    const idx = s.hands[0]!.findIndex((c) => playable(s, c));
    if (idx >= 0) { const c = s.hands[0]![idx]!; const n = uno.apply(s, playMove(idx, 0)); expect(n).not.toBeNull(); expect(n!.hands[0]!.length).toBe(6); expect(n!.discard[n!.discard.length - 1]).toBe(c); }
    expect(uno.apply(s, 999)).toBeNull(); expect(uno.apply(s, MOVE_PASS)).toBeNull();
    s = uno.apply(s, MOVE_DRAW)!; expect(s.hands[0]!.length).toBe(8); expect(uno.apply(s, MOVE_DRAW)).toBeNull();
    const p = uno.apply(s, MOVE_PASS)!; expect(p.cur).toBe(1);
  });
  it('efek kartu khusus: lewati, +2, balik arah', () => {
    const base = uno.init(3, 'a'); const mk = (card: number) => { const s = { ...base, hands: base.hands.map((h) => h.slice()), discard: [cardColor(card) * 16 + 5], color: cardColor(card) }; s.hands[0] = [card, 3]; return s; };
    expect(uno.apply(mk(1 * 16 + 10), playMove(0))!.cur).toBe(2);   // lewati
    const d2 = uno.apply(mk(1 * 16 + 12), playMove(0))!; expect(d2.hands[1]!.length).toBe(9); expect(d2.cur).toBe(2); // +2
    expect(uno.apply(mk(1 * 16 + 11), playMove(0))!.dir).toBe(-1);
    expect(uno.apply({ ...mk(4 * 16 + 13), color: 0 }, playMove(0, 4))).toBeNull(); // warna liar tidak sah
    expect(uno.apply({ ...mk(4 * 16 + 13), color: 0 }, playMove(0, 2))!.color).toBe(2);
  });
  it('pemenang saat kartu habis dan replay deterministik', () => {
    const base = uno.init(2, 'w'); const s = { ...base, hands: [[cardColor(base.discard[0]!) * 16 + 3, ], base.hands[1]!] as number[][], color: cardColor(base.discard[0]!) };
    expect(uno.winner(uno.apply(s, playMove(0))!)).toBe(0);
    const r = replayTurns(uno, ['a', 'b'], 'q', [{ uid: 'b', choice: MOVE_DRAW }, { uid: 'a', choice: MOVE_DRAW }, { uid: 'a', choice: MOVE_PASS }]);
    expect(r.count).toBe(2);
    expect(cardVal(0)).toBe(0);
  });
});
describe('Gaple', () => {
  it('28 kartu, 7 per pemain, kartu pertama bebas, mulai dari balak tertinggi', () => {
    const s = gaple.init(4, 'g'); expect(s.hands.flat().length).toBe(28); expect(new Set(s.hands.flat()).size).toBe(28);
    expect(s.hands[s.cur]!.some((t) => pips(t)[0] === pips(t)[1])).toBe(true);
  });
  it('pasang di ujung yang cocok, tolak yang tidak cocok, dan lewati hanya bila tidak bisa', () => {
    let s = gaple.init(2, 'k'); const t0 = s.hands[s.cur]![0]!; s = gaple.apply(s, gm(0, 0))!; expect(s.row.length).toBe(1);
    const [a, b] = pips(t0); expect([s.row[0]![0], s.row[0]![1]].sort()).toEqual([a, b].sort());
    const p = s.cur, h = s.hands[p]!; const bad = h.findIndex((t) => !(pips(t)[0] === s.row[0]![0] || pips(t)[1] === s.row[0]![0]));
    if (bad >= 0) expect(gaple.apply(s, gm(bad, 0))).toBeNull();
    if (hasMove(s, p)) expect(gaple.apply(s, GP)).toBeNull();
  });
  it('blok: semua lewati → pemenang berdasarkan jumlah titik terendah', () => {
    const s = { n: 2, hands: [[tile(0, 1)], [tile(5, 6)]], row: [[3, 3]] as [number, number][], cur: 0, passes: 0, win: -1 };
    const a = gaple.apply(s, GP)!, b = gaple.apply(a, GP)!; expect(b.win).toBe(0);
  });
});
describe('Ular Tangga', () => {
  it('dadu deterministik 1–6 dan ular/tangga bekerja', () => {
    for (let i = 0; i < 40; i++) { const d = diceFor('s', i); expect(d).toBeGreaterThanOrEqual(1); expect(d).toBeLessThanOrEqual(6); expect(diceFor('s', i)).toBe(d); }
    let s = ladder.init(2, 'z'); s = ladder.apply(s, 1)!; expect(s.last!.roll).toBe(diceFor('z', 0));
    const t = { ...ladder.init(2, 'z'), pos: [3, 0], moves: 0 }; const roll = diceFor('z', 0), dest = 3 + roll; const r = ladder.apply(t, 1)!;
    expect(r.pos[0]).toBe(JUMPS[dest] ?? dest);
  });
  it('tidak melewati 100 dan menang tepat di 100', () => {
    const s = { ...ladder.init(2, 'e'), pos: [99, 0] }; const r = ladder.apply(s, 1)!; const roll = diceFor('e', 0);
    expect(r.pos[0]).toBe(roll === 1 ? 100 : 99); expect(ladder.winner(r)).toBe(roll === 1 ? 0 : -1);
  });
});

describe('simulasi permainan penuh (tingkat mesin)', () => {
  it('UNO, Gaple, dan Ular Tangga selalu berakhir tanpa langkah ilegal untuk 2–4 pemain', () => {
    for (const n of [2, 3, 4]) for (let seed = 0; seed < 15; seed++) {
      let u = uno.init(n, `s${seed}`), c = 0;
      while (uno.winner(u) < 0 && c < 5000) {
        const h = u.hands[u.cur]!, i = h.findIndex((x) => playable(u, x));
        const nx = i >= 0 ? uno.apply(u, playMove(i, cardColor(h[i]!) === 4 ? 1 : 0)) : !u.drew ? uno.apply(u, MOVE_DRAW) : uno.apply(u, MOVE_PASS);
        expect(nx).not.toBeNull(); u = nx!; c++;
      }
      expect(uno.winner(u)).toBeGreaterThanOrEqual(0);
      let g = gaple.init(n, `g${seed}`); c = 0;
      while (gaple.winner(g) < 0 && c < 2000) {
        const h = g.hands[g.cur]!, i = h.findIndex((t) => canPlayG(g, t, 0) || canPlayG(g, t, 1));
        const nx = i >= 0 ? gaple.apply(g, gm(i, canPlayG(g, h[i]!, 0) ? 0 : 1)) : gaple.apply(g, GP); expect(nx).not.toBeNull(); g = nx!; c++;
      }
      expect(gaple.winner(g)).toBeGreaterThanOrEqual(0);
      let l = ladder.init(n, `l${seed}`); c = 0; while (ladder.winner(l) < 0 && c < 3000) { l = ladder.apply(l, 1)!; c++; }
      expect(ladder.winner(l)).toBeGreaterThanOrEqual(0);
    }
  });
});
