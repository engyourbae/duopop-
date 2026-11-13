import { rng, seedFrom, shuffle } from '../../../utils/rng';
import type { TurnEngine } from './types';
import { CHANCE, CHEST, auctionCap, GROUPS, GROUP_TILES, JAIL_FEE, JAIL_POS, MAX_HOTELS, MAX_HOUSES, MODES, RAILS, TAX_AMT, TILES, UTILS, isOwnable, type Card, type ModeKey } from './monopolyData';

export type Phase = 'roll' | 'buy' | 'auction' | 'debt' | 'end' | 'trade';
export interface Auction { tile: number; bid: number; top: number; turn: number; passed: boolean[] }
export interface Trade { from: number; to: number; give: number; get: number; cash: number; back: Phase }
export interface Debt { to: number; amount: number; per: number }
export interface Stats { bought: number; rentIn: number; rentOut: number; houses: number; hotels: number; jail: number; escapes: number; passGo: number; auctions: number; trades: number; maxCash: number }
export type MonoEv =
  | { t: 'roll'; who: number; d: [number, number] }
  | { t: 'move'; who: number; from: number; to: number; go: boolean; warp: boolean }
  | { t: 'cash'; who: number; amt: number }
  | { t: 'rent'; from: number; to: number; amt: number; tile: number }
  | { t: 'tax'; who: number; amt: number; tile: number }
  | { t: 'buy'; who: number; tile: number; price: number }
  | { t: 'card'; who: number; deck: 'chance' | 'chest'; idx: number }
  | { t: 'build'; who: number; tile: number; lvl: number }
  | { t: 'sell'; who: number; tile: number; lvl: number }
  | { t: 'mort'; who: number; tile: number; on: boolean }
  | { t: 'auction'; tile: number }
  | { t: 'bid'; who: number; amt: number }
  | { t: 'sold'; who: number; tile: number; price: number }
  | { t: 'unsold'; tile: number }
  | { t: 'jail'; who: number }
  | { t: 'free'; who: number; how: 'dadu' | 'bayar' | 'kartu' | 'paksa' }
  | { t: 'trade'; from: number; to: number; ok: boolean; offer: boolean }
  | { t: 'bankrupt'; who: number; to: number }
  | { t: 'end'; who: number; byLimit: boolean }
  | { t: 'win'; who: number };

export interface MonoState {
  n: number; seed: string; mode: ModeKey;
  cash: number[]; pos: number[]; jail: number[]; free: number[]; out: boolean[];
  owner: number[]; lvl: number[]; mort: boolean[];
  cur: number; phase: Phase; dbl: number; again: boolean; round: number; moves: number; resume: number; mul: number;
  dice: [number, number];
  chance: number[]; chest: number[]; ci: number; ki: number;
  auction: Auction | null; trade: Trade | null; debt: Debt | null; tradedTurn: boolean;
  win: number; ev: MonoEv[]; log: MonoEv[]; stats: Stats[];
}

export const MV = { ROLL: 1, BUY: 2, AUCTION: 3, END: 4, PAY_JAIL: 5, USE_FREE: 6, BANKRUPT: 7, ACCEPT: 8, REJECT: 9, PASS: 10, SETTLE: 11, FINISH: 12 } as const;
export const FINISH_ROUND = 40;
export const mvBuild = (t: number) => 100 + t, mvSell = (t: number) => 200 + t, mvMort = (t: number) => 300 + t, mvUnmort = (t: number) => 400 + t, mvBid = (k: number) => 500 + k;
export const BID_STEPS = [10, 50, 100];
export const TRADE_BASE = 1_000_000;
/** Penawaran dagang dikemas jadi satu bilangan bulat: tujuan, petak diberikan/diminta (40 = tidak ada), uang (kelipatan 25). */
export function tradeMove(to: number, give: number, get: number, cashStep: number, receive: boolean): number {
  return TRADE_BASE + (((to * 2 + (receive ? 1 : 0)) * 41 + cashStep) * 41 + give) * 41 + get;
}
export function decodeTrade(m: number): { to: number; give: number; get: number; cash: number } | null {
  let c = m - TRADE_BASE; if (c < 0) return null;
  const get = c % 41; c = Math.floor(c / 41); const give = c % 41; c = Math.floor(c / 41); const step = c % 41; c = Math.floor(c / 41);
  const receive = c % 2 === 1, to = Math.floor(c / 2);
  if (step > 40) return null;
  return { to, give: give === 40 ? -1 : give, get: get === 40 ? -1 : get, cash: (receive ? -1 : 1) * step * 25 };
}

export const modeSeed = (g: { mechanic: string; bank?: string }, seed: string) => (g.mechanic === 'monopoly' ? `${seed}~${g.bank ?? 'klasik'}` : seed);
const parseSeed = (raw: string): { seed: string; mode: ModeKey } => {
  const i = raw.lastIndexOf('~'), m = i >= 0 ? raw.slice(i + 1) : '';
  return { seed: i >= 0 ? raw.slice(0, i) : raw, mode: (m in MODES ? m : 'klasik') as ModeKey };
};
export const rollDice = (seed: string, moves: number): [number, number] => {
  const r = rng(seedFrom(`mono:${seed}:${moves}`));
  return [1 + Math.floor(r() * 6), 1 + Math.floor(r() * 6)];
};
const emptyStats = (cash: number): Stats => ({ bought: 0, rentIn: 0, rentOut: 0, houses: 0, hotels: 0, jail: 0, escapes: 0, passGo: 0, auctions: 0, trades: 0, maxCash: cash });

// ---------- Kueri ----------
export const alive = (s: MonoState) => s.out.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
export const ownedBy = (s: MonoState, p: number) => TILES.filter((t) => s.owner[t.id] === p).map((t) => t.id);
export const fullSet = (s: MonoState, p: number, g: number) => (GROUP_TILES[g] as number[]).every((t) => s.owner[t] === p);
const groupBuilt = (s: MonoState, g: number) => (GROUP_TILES[g] as number[]).some((t) => (s.lvl[t] as number) > 0);
export const houseCount = (s: MonoState) => s.lvl.reduce((a, l) => a + (l > 0 && l < 5 ? l : 0), 0);
export const hotelCount = (s: MonoState) => s.lvl.reduce((a, l) => a + (l === 5 ? 1 : 0), 0);
export const unmortCost = (t: number) => Math.ceil(((TILES[t] as { price: number }).price * 55) / 100);
export const netWorth = (s: MonoState, p: number) => s.cash[p] as number + ownedBy(s, p).reduce((a, t) => {
  const tl = TILES[t]!; return a + (s.mort[t] ? tl.price / 2 : tl.price + (tl.group >= 0 ? (s.lvl[t] as number) * (GROUPS[tl.group] as { house: number }).house : 0));
}, 0);
export function rentFor(s: MonoState, t: number, diceSum: number, mul = 1): number {
  const tl = TILES[t] as (typeof TILES)[number], o = s.owner[t] as number;
  if (o < 0 || s.mort[t]) return 0;
  if (tl.kind === 'prop') { const l = s.lvl[t] as number; return (tl.rent[l] as number) * (l === 0 && fullSet(s, o, tl.group) ? 2 : 1); }
  if (tl.kind === 'rail') { const c = RAILS.filter((r) => s.owner[r] === o).length; return 25 * 2 ** (c - 1) * (mul === 2 ? 2 : 1); }
  const c = UTILS.filter((u) => s.owner[u] === o).length;
  return diceSum * (mul === 10 || c >= 2 ? 10 : 4);
}
export function canBuild(s: MonoState, p: number, t: number): boolean {
  const tl = TILES[t]!; if (tl.kind !== 'prop' || s.owner[t] !== p || !fullSet(s, p, tl.group)) return false;
  const g = GROUP_TILES[tl.group] as number[], l = s.lvl[t] as number;
  if (g.some((x) => s.mort[x]) || l >= 5 || l !== Math.min(...g.map((x) => s.lvl[x] as number))) return false;
  if ((s.cash[p] as number) < (GROUPS[tl.group] as { house: number }).house) return false;
  return l === 4 ? hotelCount(s) < MAX_HOTELS : houseCount(s) < MAX_HOUSES;
}
export function canSell(s: MonoState, p: number, t: number): boolean {
  const tl = TILES[t]!; if (tl.kind !== 'prop' || s.owner[t] !== p) return false;
  const l = s.lvl[t] as number, g = GROUP_TILES[tl.group] as number[];
  if (l <= 0 || l !== Math.max(...g.map((x) => s.lvl[x] as number))) return false;
  return l === 5 ? MAX_HOUSES - houseCount(s) >= 4 : true;
}
export function canMortgage(s: MonoState, p: number, t: number): boolean {
  const tl = TILES[t]!; if (!isOwnable(tl) || s.owner[t] !== p || s.mort[t]) return false;
  return tl.kind !== 'prop' || !groupBuilt(s, tl.group);
}
export const canUnmortgage = (s: MonoState, p: number, t: number) => s.owner[t] === p && !!s.mort[t] && (s.cash[p] as number) >= unmortCost(t);
/** Uang yang masih bisa dikumpulkan dari menjual bangunan dan menggadai. */
export function liquidValue(s: MonoState, p: number): number {
  return ownedBy(s, p).reduce((a, t) => { const tl = TILES[t]!; return a + (s.mort[t] ? 0 : tl.price / 2) + (tl.group >= 0 ? (s.lvl[t] as number) * (GROUPS[tl.group] as { house: number }).house / 2 : 0); }, 0);
}
const noBuildings = (s: MonoState, t: number) => { const g = TILES[t]!.group; return g < 0 || !groupBuilt(s, g); };
export function validTrade(s: MonoState, from: number, to: number, give: number, get: number, cash: number): boolean {
  if (from === to || s.out[from] || s.out[to] || to < 0 || to >= s.n) return false;
  if (give < 0 && get < 0 && cash === 0) return false;
  if (give >= 0 && (s.owner[give] !== from || !noBuildings(s, give))) return false;
  if (get >= 0 && (s.owner[get] !== to || !noBuildings(s, get))) return false;
  if (cash > 0 && (s.cash[from] as number) < cash) return false;
  if (cash < 0 && (s.cash[to] as number) < -cash) return false;
  return true;
}

// ---------- Tantangan ----------
export interface Challenge { id: string; title: string; desc: string; target: number; value: (s: MonoState, p: number) => number; xp: number }
const setsOwned = (s: MonoState, p: number) => GROUPS.filter((_, g) => fullSet(s, p, g)).length;
export const CHALLENGES: Challenge[] = [
  { id: 'tuan', title: 'Tuan Tanah', desc: 'Miliki 6 petak properti sekaligus.', target: 6, xp: 10, value: (s, p) => ownedBy(s, p).length },
  { id: 'set', title: 'Kuasai Satu Set', desc: 'Lengkapi satu set warna penuh.', target: 1, xp: 10, value: setsOwned },
  { id: 'sewa', title: 'Raja Kontrakan', desc: 'Kumpulkan total sewa Rp500jt.', target: 500, xp: 10, value: (s, p) => (s.stats[p] as Stats).rentIn },
  { id: 'rumah', title: 'Pengembang', desc: 'Bangun 4 rumah.', target: 4, xp: 10, value: (s, p) => (s.stats[p] as Stats).houses },
  { id: 'hotel', title: 'Hotel Bintang Lima', desc: 'Bangun 1 hotel.', target: 1, xp: 15, value: (s, p) => (s.stats[p] as Stats).hotels },
  { id: 'lelang', title: 'Pemenang Lelang', desc: 'Menangkan 1 lelang.', target: 1, xp: 10, value: (s, p) => (s.stats[p] as Stats).auctions },
  { id: 'dagang', title: 'Pedagang Ulung', desc: 'Sepakati 1 perdagangan.', target: 1, xp: 10, value: (s, p) => (s.stats[p] as Stats).trades },
  { id: 'sultan', title: 'Sultan', desc: 'Punya kas Rp3 M.', target: 3000, xp: 15, value: (s, p) => (s.stats[p] as Stats).maxCash },
  { id: 'lolos', title: 'Lolos Hukum', desc: 'Keluar penjara lewat dadu kembar.', target: 1, xp: 10, value: (s, p) => (s.stats[p] as Stats).escapes },
  { id: 'keliling', title: 'Keliling Nusantara', desc: 'Lewati MULAI 5 kali.', target: 5, xp: 10, value: (s, p) => (s.stats[p] as Stats).passGo },
];
export const challengeXp = (s: MonoState, p: number) => CHALLENGES.reduce((a, c) => a + (c.value(s, p) >= c.target ? c.xp : 0), 0);

// ---------- Mutasi ----------
const clone = (s: MonoState): MonoState => ({
  ...s, cash: s.cash.slice(), pos: s.pos.slice(), jail: s.jail.slice(), free: s.free.slice(), out: s.out.slice(),
  owner: s.owner.slice(), lvl: s.lvl.slice(), mort: s.mort.slice(), dice: [s.dice[0], s.dice[1]], ev: [],
  auction: s.auction ? { ...s.auction, passed: s.auction.passed.slice() } : null, trade: s.trade ? { ...s.trade } : null, debt: s.debt ? { ...s.debt } : null,
  stats: s.stats.map((x) => ({ ...x })), log: s.log.slice(),
});
const ev = (s: MonoState, e: MonoEv) => { s.ev.push(e); };
const nextAlive = (s: MonoState, from: number) => { for (let k = 1; k <= s.n; k++) { const i = (from + k) % s.n; if (!s.out[i]) return i; } return from; };
const afterLand = (s: MonoState) => { s.phase = s.again && (s.jail[s.cur] as number) === 0 && !s.out[s.cur] ? 'roll' : 'end'; s.mul = 1; };

function gain(s: MonoState, p: number, amt: number) { s.cash[p] = (s.cash[p] as number) + amt; ev(s, { t: 'cash', who: p, amt }); }
/** Bayar; bila uang kurang masuk fase utang (pemain harus menjual/menggadai atau menyerah). */
function pay(s: MonoState, p: number, amt: number, to: number, per = 0): boolean {
  if (amt <= 0) return true;
  if ((s.cash[p] as number) < amt) { s.debt = { to, amount: amt, per }; s.phase = 'debt'; return false; }
  settleNow(s, p, amt, to, per); return true;
}
function settleNow(s: MonoState, p: number, amt: number, to: number, per: number) {
  s.cash[p] = (s.cash[p] as number) - amt; ev(s, { t: 'cash', who: p, amt: -amt });
  if (to >= 0) { s.cash[to] = (s.cash[to] as number) + amt; ev(s, { t: 'cash', who: to, amt }); }
  else if (to === -2) for (const o of alive(s)) if (o !== p) { s.cash[o] = (s.cash[o] as number) + per; ev(s, { t: 'cash', who: o, amt: per }); }
}
function jailIt(s: MonoState, p: number) {
  const from = s.pos[p] as number; s.pos[p] = JAIL_POS; s.jail[p] = 1; s.dbl = 0; s.again = false; (s.stats[p] as Stats).jail++;
  ev(s, { t: 'move', who: p, from, to: JAIL_POS, go: false, warp: true }); ev(s, { t: 'jail', who: p });
}
function moveTo(s: MonoState, p: number, to: number, how: 'step' | 'warp', passGo: boolean) {
  const from = s.pos[p] as number;
  if (passGo) { gain(s, p, MODES[s.mode].go); (s.stats[p] as Stats).passGo++; }
  s.pos[p] = to; ev(s, { t: 'move', who: p, from, to, go: passGo, warp: how === 'warp' });
  land(s, p);
}
function land(s: MonoState, p: number) {
  const t = s.pos[p] as number, tl = TILES[t]!;
  switch (tl.kind) {
    case 'gojail': jailIt(s, p); s.phase = 'end'; return;
    case 'tax': { const a = TAX_AMT[t] as number; ev(s, { t: 'tax', who: p, amt: a, tile: t }); if (pay(s, p, a, -1)) afterLand(s); return; }
    case 'chance': case 'chest': drawCard(s, p, tl.kind); return;
    case 'prop': case 'rail': case 'util': {
      const o = s.owner[t] as number;
      if (o < 0) { s.phase = 'buy'; return; }
      if (o !== p && !s.mort[t]) {
        const r = rentFor(s, t, s.dice[0] + s.dice[1], s.mul);
        ev(s, { t: 'rent', from: p, to: o, amt: r, tile: t }); (s.stats[o] as Stats).rentIn += Math.min(r, s.cash[p] as number); (s.stats[p] as Stats).rentOut += r;
        if (!pay(s, p, r, o)) return;
      }
      afterLand(s); return;
    }
    default: afterLand(s);
  }
}
function drawCard(s: MonoState, p: number, deck: 'chance' | 'chest') {
  const order = deck === 'chance' ? s.chance : s.chest, ptr = deck === 'chance' ? s.ci : s.ki, idx = order[ptr % 16] as number;
  if (deck === 'chance') s.ci++; else s.ki++;
  ev(s, { t: 'card', who: p, deck, idx });
  const card: Card = (deck === 'chance' ? CHANCE : CHEST)[idx]!, fx = card.fx, here = s.pos[p] as number;
  switch (fx.t) {
    case 'move': moveTo(s, p, fx.to, 'warp', fx.to < here || fx.to === 0); return;
    case 'rail': { const to = RAILS.find((r) => r > here) ?? RAILS[0] as number; s.mul = 2; moveTo(s, p, to, 'warp', to < here); return; }
    case 'util': { const to = UTILS.find((u) => u > here) ?? UTILS[0] as number; s.mul = 10; moveTo(s, p, to, 'warp', to < here); return; }
    case 'back': { const to = (here + 40 - fx.n) % 40; s.pos[p] = to; ev(s, { t: 'move', who: p, from: here, to, go: false, warp: true }); land(s, p); return; }
    case 'cash': if (fx.n >= 0) gain(s, p, fx.n); else if (!pay(s, p, -fx.n, -1)) return; break;
    case 'each': {
      const others = alive(s).filter((o) => o !== p);
      if (fx.n > 0) for (const o of others) { const a = Math.min(fx.n, s.cash[o] as number); s.cash[o] = (s.cash[o] as number) - a; ev(s, { t: 'cash', who: o, amt: -a }); gain(s, p, a); }
      else if (!pay(s, p, -fx.n * others.length, -2, -fx.n)) return;
      break;
    }
    case 'repair': { let tot = 0; for (const t of ownedBy(s, p)) { const l = s.lvl[t] as number; tot += l === 5 ? fx.H : l * fx.h; } if (tot > 0 && !pay(s, p, tot, -1)) return; break; }
    case 'jail': jailIt(s, p); s.phase = 'end'; return;
    case 'free': s.free[p] = (s.free[p] as number) + 1; break;
  }
  afterLand(s);
}
function rollMove(s: MonoState, p: number, steps: number) {
  const from = s.pos[p] as number, to = (from + steps) % 40;
  moveTo(s, p, to, 'step', from + steps >= 40);
}
function nextTurn(s: MonoState, byLimit = false) {
  const prev = s.cur; ev(s, { t: 'end', who: prev, byLimit });
  const nx = nextAlive(s, prev);
  if (nx <= prev) s.round++;
  s.cur = nx; s.dbl = 0; s.again = false; s.tradedTurn = false; s.phase = 'roll'; s.mul = 1;
  const lim = MODES[s.mode].rounds;
  if (lim > 0 && s.round > lim) finishByWorth(s);
}
function finishByWorth(s: MonoState) {
  let best = -1, bw = -1; for (const i of alive(s)) { const w = netWorth(s, i); if (w > bw) { bw = w; best = i; } }
  s.win = best; ev(s, { t: 'win', who: best });
}
function startAuction(s: MonoState, tile: number) {
  const passed = s.out.slice(); s.auction = { tile, bid: 0, top: -1, turn: s.cur, passed }; s.phase = 'auction'; ev(s, { t: 'auction', tile });
}
function finishAuction(s: MonoState) {
  const a = s.auction as Auction;
  if (a.top >= 0) {
    s.cash[a.top] = (s.cash[a.top] as number) - a.bid; s.owner[a.tile] = a.top; (s.stats[a.top] as Stats).auctions++; (s.stats[a.top] as Stats).bought++;
    ev(s, { t: 'cash', who: a.top, amt: -a.bid }); ev(s, { t: 'sold', who: a.top, tile: a.tile, price: a.bid });
  } else ev(s, { t: 'unsold', tile: a.tile });
  s.auction = null; afterLand(s);
}
function advanceAuction(s: MonoState) {
  const a = s.auction as Auction, act = s.out.map((_, i) => i).filter((i) => !a.passed[i]);
  const finish = () => finishAuction(s);
  if (act.length === 0 || (a.top >= 0 && act.length === 1 && act[0] === a.top)) { finish(); return; }
  for (let k = 1; k <= s.n; k++) { const i = (a.turn + k) % s.n; if (!a.passed[i] && i !== a.top) { a.turn = i; return; } }
  finish();
}
function bankrupt(s: MonoState, p: number) {
  const d = s.debt, cred = d && d.to >= 0 ? d.to : -1;
  for (const t of ownedBy(s, p)) { s.lvl[t] = 0; if (cred >= 0) s.owner[t] = cred; else { s.owner[t] = -1; s.mort[t] = false; } }
  if (cred >= 0) { s.cash[cred] = (s.cash[cred] as number) + (s.cash[p] as number); s.free[cred] = (s.free[cred] as number) + (s.free[p] as number); }
  s.cash[p] = 0; s.free[p] = 0; s.out[p] = true; s.debt = null; s.resume = 0; ev(s, { t: 'bankrupt', who: p, to: cred });
  const left = alive(s);
  if (left.length === 1) { s.win = left[0] as number; ev(s, { t: 'win', who: s.win }); return; }
  nextTurn(s);
}

function handle(s: MonoState, m: number): boolean {
  const p = s.cur, ph = s.phase;
  if (ph === 'auction') {
    const a = s.auction as Auction, who = a.turn;
    if (m === MV.PASS) { a.passed[who] = true; advanceAuction(s); return true; }
    if (m >= 500 && m < 500 + BID_STEPS.length) {
      const cap = auctionCap(a.tile), nb = Math.min(a.bid + (BID_STEPS[m - 500] as number), cap);
      if (nb <= a.bid || (s.cash[who] as number) < nb) return false;
      a.bid = nb; a.top = who; ev(s, { t: 'bid', who, amt: nb });
      if (nb >= cap) finishAuction(s); else advanceAuction(s);
      return true;
    }
    return false;
  }
  if (ph === 'trade') {
    const tr = s.trade as Trade;
    if (m === MV.REJECT) { ev(s, { t: 'trade', from: tr.from, to: tr.to, ok: false, offer: false }); s.phase = tr.back; s.trade = null; return true; }
    if (m === MV.ACCEPT) {
      if (!validTrade(s, tr.from, tr.to, tr.give, tr.get, tr.cash)) return false;
      if (tr.give >= 0) s.owner[tr.give] = tr.to;
      if (tr.get >= 0) s.owner[tr.get] = tr.from;
      s.cash[tr.from] = (s.cash[tr.from] as number) - tr.cash; s.cash[tr.to] = (s.cash[tr.to] as number) + tr.cash;
      (s.stats[tr.from] as Stats).trades++; (s.stats[tr.to] as Stats).trades++;
      ev(s, { t: 'trade', from: tr.from, to: tr.to, ok: true, offer: false }); s.phase = tr.back; s.trade = null; return true;
    }
    return false;
  }
  // pengelolaan aset
  if (m >= 100 && m < 500) {
    const t = m % 100, kind = Math.floor(m / 100);
    if (t >= 40) return false;
    const free = ph === 'roll' || ph === 'end';
    if (kind === 1 && free && canBuild(s, p, t)) {
      const g = GROUPS[TILES[t]!.group] as { house: number }; s.cash[p] = (s.cash[p] as number) - g.house; s.lvl[t] = (s.lvl[t] as number) + 1;
      (s.stats[p] as Stats)[s.lvl[t] === 5 ? 'hotels' : 'houses']++; ev(s, { t: 'build', who: p, tile: t, lvl: s.lvl[t] as number }); return true;
    }
    if (kind === 2 && (free || ph === 'debt' || ph === 'buy') && canSell(s, p, t)) {
      const g = GROUPS[TILES[t]!.group] as { house: number }; s.lvl[t] = (s.lvl[t] as number) - 1; s.cash[p] = (s.cash[p] as number) + g.house / 2;
      ev(s, { t: 'sell', who: p, tile: t, lvl: s.lvl[t] as number }); return true;
    }
    if (kind === 3 && (free || ph === 'debt' || ph === 'buy') && canMortgage(s, p, t)) {
      s.mort[t] = true; s.cash[p] = (s.cash[p] as number) + TILES[t]!.price / 2; ev(s, { t: 'mort', who: p, tile: t, on: true }); return true;
    }
    if (kind === 4 && free && canUnmortgage(s, p, t)) {
      s.mort[t] = false; s.cash[p] = (s.cash[p] as number) - unmortCost(t); ev(s, { t: 'mort', who: p, tile: t, on: false }); return true;
    }
    return false;
  }
  if (m >= TRADE_BASE) {
    const d = decodeTrade(m); if (!d || (ph !== 'roll' && ph !== 'end') || !validTrade(s, p, d.to, d.give, d.get, d.cash)) return false;
    s.trade = { from: p, to: d.to, give: d.give, get: d.get, cash: d.cash, back: ph }; s.phase = 'trade'; s.tradedTurn = true;
    ev(s, { t: 'trade', from: p, to: d.to, ok: false, offer: true }); return true;
  }
  switch (m) {
    case MV.ROLL: {
      if (ph !== 'roll') return false;
      const d = rollDice(s.seed, s.moves - 1), sum = d[0] + d[1]; s.dice = d; ev(s, { t: 'roll', who: p, d });
      if ((s.jail[p] as number) > 0) {
        if (d[0] === d[1]) { s.jail[p] = 0; (s.stats[p] as Stats).escapes++; ev(s, { t: 'free', who: p, how: 'dadu' }); s.again = false; rollMove(s, p, sum); return true; }
        if ((s.jail[p] as number) >= 3) {
          s.jail[p] = 0; ev(s, { t: 'free', who: p, how: 'paksa' }); s.again = false;
          if (pay(s, p, JAIL_FEE, -1)) rollMove(s, p, sum); else s.resume = sum;
          return true;
        }
        s.jail[p] = (s.jail[p] as number) + 1; s.phase = 'end'; return true;
      }
      s.dbl = d[0] === d[1] ? s.dbl + 1 : 0;
      if (s.dbl === 3) { jailIt(s, p); s.phase = 'end'; return true; }
      s.again = d[0] === d[1]; rollMove(s, p, sum); return true;
    }
    case MV.PAY_JAIL: if (ph !== 'roll' || (s.jail[p] as number) === 0 || (s.cash[p] as number) < JAIL_FEE) return false; pay(s, p, JAIL_FEE, -1); s.jail[p] = 0; ev(s, { t: 'free', who: p, how: 'bayar' }); return true;
    case MV.USE_FREE: if (ph !== 'roll' || (s.jail[p] as number) === 0 || (s.free[p] as number) < 1) return false; s.free[p] = (s.free[p] as number) - 1; s.jail[p] = 0; ev(s, { t: 'free', who: p, how: 'kartu' }); return true;
    case MV.BUY: {
      if (ph !== 'buy') return false; const t = s.pos[p] as number, pr = TILES[t]!.price; if ((s.cash[p] as number) < pr) return false;
      s.cash[p] = (s.cash[p] as number) - pr; s.owner[t] = p; (s.stats[p] as Stats).bought++; ev(s, { t: 'cash', who: p, amt: -pr }); ev(s, { t: 'buy', who: p, tile: t, price: pr }); afterLand(s); return true;
    }
    case MV.AUCTION: if (ph !== 'buy') return false; startAuction(s, s.pos[p] as number); return true;
    case MV.END: if (ph !== 'end') return false; nextTurn(s); return true;
    case MV.SETTLE: {
      if (ph !== 'debt' || !s.debt || (s.cash[p] as number) < s.debt.amount) return false;
      const d = s.debt; settleNow(s, p, d.amount, d.to, d.per); s.debt = null;
      if (s.resume > 0) { const st = s.resume; s.resume = 0; rollMove(s, p, st); } else afterLand(s);
      return true;
    }
    case MV.FINISH: if (ph !== 'end' || s.mode !== 'klasik' || s.round < FINISH_ROUND) return false; finishByWorth(s); return true;
    case MV.BANKRUPT: if (ph !== 'debt') return false; bankrupt(s, p); return true;
  }
  return false;
}

export const monopoly: TurnEngine<MonoState> = {
  init(n, raw) {
    const { seed, mode } = parseSeed(raw), cfg = MODES[mode], r = rng(seedFrom(`monodeck:${seed}`)), ids = Array.from({ length: 16 }, (_, i) => i);
    return {
      n, seed, mode, cash: Array(n).fill(cfg.cash), pos: Array(n).fill(0), jail: Array(n).fill(0), free: Array(n).fill(0), out: Array(n).fill(false),
      owner: Array(40).fill(-1), lvl: Array(40).fill(0), mort: Array(40).fill(false), cur: 0, phase: 'roll', dbl: 0, again: false, round: 1, moves: 0, resume: 0, mul: 1,
      dice: [1, 1], chance: shuffle(ids, r), chest: shuffle(ids, r), ci: 0, ki: 0, auction: null, trade: null, debt: null, tradedTurn: false,
      win: -1, ev: [], log: [], stats: Array.from({ length: n }, () => emptyStats(cfg.cash)),
    };
  },
  actor: (s) => (s.phase === 'auction' && s.auction ? s.auction.turn : s.phase === 'trade' && s.trade ? s.trade.to : s.cur),
  winner: (s) => s.win,
  apply(s0, m) {
    if (s0.win >= 0 || !Number.isInteger(m)) return null;
    const s = clone(s0); s.moves++;
    if (!handle(s, m)) return null;
    for (const i of alive(s)) { const st = s.stats[i] as Stats; if ((s.cash[i] as number) > st.maxCash) st.maxCash = s.cash[i] as number; }
    s.log = [...s.log, ...s.ev].slice(-60);
    return s;
  },
};
