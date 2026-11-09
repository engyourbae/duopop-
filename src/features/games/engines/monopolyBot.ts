import { rng, seedFrom } from '../../../utils/rng';
import { GROUPS, GROUP_TILES, TILES, RAILS } from './monopolyData';
import { BID_STEPS, MV, alive, canBuild, canSell, canUnmortgage, fullSet, monopoly, mvBid, mvBuild, mvMort, mvSell, mvUnmort, ownedBy, tradeMove, unmortCost, validTrade, type MonoState } from './monopoly';

/** Nilai sebuah petak bagi pemain p: harga + bonus bila membantu melengkapi set warna. */
function worth(s: MonoState, p: number, t: number): number {
  const tl = TILES[t]!;
  if (tl.kind === 'rail') return tl.price * (1 + 0.3 * RAILS.filter((r) => s.owner[r] === p).length);
  if (tl.kind === 'util') return tl.price;
  if (tl.kind !== 'prop') return 0;
  const g = GROUP_TILES[tl.group] as number[], mine = g.filter((x) => s.owner[x] === p).length;
  return tl.price * (mine === g.length - 1 ? 2.2 : mine > 0 ? 1.25 : 1);
}
const round25 = (n: number) => Math.max(25, Math.round(n / 25) * 25);

/**
 * Pilihan langkah bot. level 0 = santai (hati-hati, tidak berdagang), 1 = cerdas.
 * Setiap kandidat diuji lewat mesin sehingga langkah yang dikembalikan selalu sah.
 */
export function botMove(s: MonoState, level: 0 | 1 = 1): number {
  const a = monopoly.actor(s), r = rng(seedFrom(`bot:${s.seed}:${s.moves}`)), cash = s.cash[a] as number;
  const ok = (m: number) => monopoly.apply(s, m) !== null;
  const first = (c: number[], fb: number) => c.find(ok) ?? fb;
  const reserve = level === 1 ? 80 : 160;
  const mine = ownedBy(s, a);

  if (s.phase === 'auction' && s.auction) {
    const au = s.auction, v = worth(s, a, au.tile) * (level === 1 ? 0.95 : 0.8);
    const picks: number[] = [];
    if (au.bid + BID_STEPS[1]! <= v * 0.8) picks.push(mvBid(1));
    if (au.bid + BID_STEPS[0]! <= v) picks.push(mvBid(0));
    return first(picks.filter((m) => cash - (au.bid + (BID_STEPS[m - 500] as number)) >= (level === 1 ? 30 : 80)), MV.PASS);
  }
  if (s.phase === 'trade' && s.trade) {
    const tr = s.trade, gainV = tr.give >= 0 ? worth(s, a, tr.give) : 0, lossV = tr.get >= 0 ? worth(s, a, tr.get) : 0;
    const score = gainV - lossV + tr.cash;
    return score > (level === 1 ? 40 : 0) && ok(MV.ACCEPT) ? MV.ACCEPT : MV.REJECT;
  }
  if (s.phase === 'debt' && s.debt) {
    if (cash >= s.debt.amount) return MV.SETTLE;
    const sells = mine.filter((t) => canSell(s, a, t)).sort((x, y) => (s.lvl[y] as number) - (s.lvl[x] as number));
    const m1 = first(sells.map(mvSell), -1); if (m1 >= 0) return m1;
    const morts = mine.map(mvMort).filter(ok);
    if (morts.length) return morts.sort((x, y) => TILES[x - 300]!.price - TILES[y - 300]!.price)[0] as number;
    return MV.BANKRUPT;
  }
  if (s.phase === 'buy') {
    const t = s.pos[a] as number, tl = TILES[t]!, key = tl.kind === 'rail' || worth(s, a, t) > tl.price * 1.5;
    if (cash >= tl.price && (cash - tl.price >= reserve || (key && cash - tl.price >= 20))) return MV.BUY;
    return MV.AUCTION;
  }
  // fase roll / end: kelola aset dulu
  if (s.phase === 'roll' && (s.jail[a] as number) > 0) {
    if (ok(MV.USE_FREE)) return MV.USE_FREE;
    if (level === 1 && cash > 700 && s.round < 12 && ok(MV.PAY_JAIL)) return MV.PAY_JAIL;
  }
  const builds = mine.filter((t) => canBuild(s, a, t) && cash - (GROUPS[TILES[t]!.group] as { house: number }).house >= reserve + 40).sort((x, y) => TILES[y]!.group - TILES[x]!.group);
  if (builds.length) return mvBuild(builds[0] as number);
  const un = mine.filter((t) => canUnmortgage(s, a, t) && cash - unmortCost(t) >= 400);
  if (un.length) return mvUnmort(un[0] as number);
  if (level === 1 && !s.tradedTurn && r() < 0.4 && cash > 250) {
    for (let g = 0; g < GROUPS.length; g++) {
      const ts = GROUP_TILES[g] as number[], have = ts.filter((t) => s.owner[t] === a);
      const miss = ts.filter((t) => s.owner[t] !== a);
      if (have.length !== ts.length - 1 || miss.length !== 1) continue;
      const t = miss[0] as number, q = s.owner[t] as number;
      if (q < 0 || !alive(s).includes(q) || fullSet(s, q, g)) continue;
      const amt = Math.min(round25(TILES[t]!.price * 1.7), Math.floor((cash - 120) / 25) * 25);
      if (amt < 25 || amt / 25 > 40) continue;
      if (validTrade(s, a, q, -1, t, amt)) return tradeMove(q, 40, t, amt / 25, false);
    }
  }
  return s.phase === 'roll' ? MV.ROLL : MV.END;
}
