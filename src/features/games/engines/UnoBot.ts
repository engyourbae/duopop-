import { uno, playable, playMove, MOVE_DRAW, MOVE_PASS, cardColor, cardVal, face, type UnoState } from './uno';

/** Bot UNO. Santai: main acak, kadang lupa/mengambil kartu sendiri. Serius: menilai tiap langkah (kartu tersisa, serangan ke lawan, warna, hemat kartu liar). Keduanya tetap bisa dikalahkan. */
export type BotLevel = 'santai' | 'serius';
type Rnd = () => number;

/** Semua langkah main kartu yang sah untuk pemain giliran saat ini (termasuk pilihan warna liar / target kartu 7). */
function legalPlays(s: UnoState): number[] {
  const hand = s.hands[s.cur] as number[], out: number[] = [];
  hand.forEach((c, i) => {
    if (!playable(s, c)) return;
    const f = face(s, c), cands: number[] = [];
    if (cardColor(f) === 4) for (let k = 0; k < 4; k++) cands.push(playMove(i, k));
    else if (s.rules.seven && cardVal(f) === 7) for (let t = 0; t < s.n; t++) cands.push(playMove(i, t));
    else cands.push(playMove(i));
    for (const m of cands) if (uno.apply(s, m)) out.push(m);
  });
  return out;
}
const pick = <T,>(a: T[], rnd: Rnd) => a[Math.floor(rnd() * a.length)] as T;

function santai(s: UnoState, plays: number[], rnd: Rnd): number {
  if (!plays.length) return MOVE_DRAW;
  if (s.pend > 0) return rnd() < 0.55 ? pick(plays, rnd) : MOVE_DRAW; // sering tidak menumpuk hukuman
  if (s.drew) return rnd() < 0.7 ? pick(plays, rnd) : MOVE_PASS;
  if (rnd() < 0.12) return MOVE_DRAW; // kadang malah mengambil kartu
  return pick(plays, rnd);
}

function score(s: UnoState, m: number, who: number, rnd: Rnd): number {
  const ns = uno.apply(s, m) as UnoState;
  if (ns.out[who]) return -1e4;
  if (ns.win >= 0) return ns.win === who ? 1e5 : -1e5;
  const mine = ns.hands[who] as number[];
  const opp = (st: UnoState) => st.hands.reduce((a, h, i) => (i === who || st.out[i] ? a : a + h.length), 0);
  let sc = -mine.length * 12 + (opp(ns) - opp(s)) * 3; // sedikit kartu = bagus; membuat lawan menambah kartu = bagus
  const nx = ns.cur;
  if (nx !== who && !ns.out[nx]) {
    const nh = (ns.hands[nx] as number[]).length;
    if (ns.pend > 0 && m !== MOVE_DRAW) sc += ns.pend * 2 + (nh <= 2 ? 10 : 0); // serang lawan yang hampir menang
    else if (nh === 1) sc -= 14; // jangan biarkan lawan UNO bermain bebas
  }
  const usable = mine.filter((c) => { const f = face(ns, c); return cardColor(f) === 4 || cardColor(f) === ns.color; }).length;
  sc += usable * 3 + new Set(mine.map((c) => cardColor(face(ns, c))).filter((c) => c < 4)).size * 2; // simpan banyak pilihan warna
  if (m >= 100) {
    const f = face(s, (s.hands[who] as number[])[Math.floor((m - 100) / 5)] as number);
    if (cardColor(f) === 4 && mine.length > 2 && s.pend === 0) sc -= 9; // hemat kartu liar untuk nanti
  }
  if (mine.length >= 18) sc -= (mine.length - 17) * 10; // hindari tersingkir (No Mercy)
  return sc + rnd() * 3;
}

function serius(s: UnoState, plays: number[], rnd: Rnd): number {
  const who = s.cur, cands = [...plays];
  if (uno.apply(s, MOVE_DRAW)) cands.push(MOVE_DRAW);
  if (uno.apply(s, MOVE_PASS)) cands.push(MOVE_PASS);
  const ranked = cands.map((m) => ({ m, v: score(s, m, who, rnd) })).sort((a, b) => b.v - a.v);
  return rnd() < 0.07 && ranked.length > 1 ? (ranked[1] as { m: number }).m : (ranked[0] as { m: number }).m; // sesekali meleset
}

/** Langkah berikutnya untuk pemain giliran saat ini; selalu mengembalikan langkah yang sah. */
export function unoBot(s: UnoState, level: BotLevel, rnd: Rnd = Math.random): number {
  const plays = legalPlays(s);
  const m = level === 'serius' ? serius(s, plays, rnd) : santai(s, plays, rnd);
  for (const x of [m, MOVE_DRAW, MOVE_PASS]) if (uno.apply(s, x)) return x;
  return MOVE_PASS;
}
