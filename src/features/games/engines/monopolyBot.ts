import { rng, seedFrom } from '../../../utils/rng';
import { GROUPS, GROUP_TILES, MODES, RAILS, TILES, UTILS, marketPct } from './monopolyData';
import { BID_STEPS, MV, alive, canBuild, canSell, canUnmortgage, fullSet, monopoly, mvBid, mvBuild, mvMort, mvSell, mvUnmort, ownedBy, rentFor, tradeMove, unmortCost, validTrade, type MonoState } from './monopoly';
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
export function basicMove(s: MonoState, level: 0 | 1 = 1): number {
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


// ================= Bot Cerdas (level 1) =================
// Menilai petak dengan memperhitungkan set warna, menghalangi lawan, dan event pasar; menyimpan kas sesuai bahaya di depan;
// membangun dulu ke 3 rumah di kawasan paling menguntungkan; berdagang (beli/tukar) untuk melengkapi set; menahan diri di penjara saat papan berbahaya.
const GW = [0.8, 0.9, 1.05, 1.2, 1.15, 1.15, 1.0, 0.95]; // kualitas kawasan (seberapa sering didarati & balik modalnya)
const evMul = (s: MonoState, t: number) => { const mk = s.mk ?? -1; return mk >= 0 ? Math.min(1.25, Math.max(0.85, 1 + (marketPct(mk, TILES[t] as (typeof TILES)[number]) / 100 - 1) * 0.4)) : 1; };
/** Apakah ada lawan yang sudah memegang semua petak lain di set ini (petak ini = penentu set mereka)? */
const oppOwnsRest = (s: MonoState, p: number, t: number) => {
  const tl = TILES[t] as (typeof TILES)[number]; if (tl.kind !== 'prop') return false;
  const g = GROUP_TILES[tl.group] as number[];
  return alive(s).some((q) => q !== p && g.every((x) => x === t || s.owner[x] === q));
};
function worth2(s: MonoState, p: number, t: number): number {
  const tl = TILES[t] as (typeof TILES)[number];
  if (tl.kind === 'rail') return tl.price * (1 + 0.35 * RAILS.filter((r) => r !== t && s.owner[r] === p).length) * evMul(s, t);
  if (tl.kind === 'util') return tl.price * (UTILS.some((u) => u !== t && s.owner[u] === p) ? 1.2 : 0.85);
  if (tl.kind !== 'prop') return 0;
  const g = GROUP_TILES[tl.group] as number[], mine = g.filter((x) => x !== t && s.owner[x] === p).length;
  let v = tl.price * (GW[tl.group] as number) * evMul(s, t);
  if (mine === g.length - 1) v *= 2.4; else if (mine > 0) v *= 1.35;
  if (oppOwnsRest(s, p, t)) v *= 1.8;
  return v;
}
/** Sewa terbesar yang mengintai dalam 12 petak ke depan. */
function risk(s: MonoState, p: number): number {
  let worst = 0; const pos = s.pos[p] as number;
  for (let k = 2; k <= 12; k++) { const t = (pos + k) % 40, o = s.owner[t] as number; if (o >= 0 && o !== p && !s.mort[t]) worst = Math.max(worst, rentFor(s, t, 7)); }
  return worst;
}
const reserveFor = (s: MonoState, p: number) => { const r = Math.max(50, Math.min(risk(s, p) * 0.85, 700)); return s.round <= 5 ? Math.min(r, 120) : r; };
const oppBuildings = (s: MonoState, p: number) => alive(s).reduce((a, q) => (q === p ? a : a + ownedBy(s, q).reduce((b, t) => b + (s.lvl[t] as number), 0)), 0);

export function smartMove(s: MonoState): number {
  const a = monopoly.actor(s), r = rng(seedFrom(`bot:${s.seed}:${s.moves}`)), cash = s.cash[a] as number;
  const ok = (m: number) => monopoly.apply(s, m) !== null;
  const first = (c: number[], fb: number) => c.find(ok) ?? fb;
  const mine = ownedBy(s, a), lim = MODES[s.mode].rounds, left = lim > 0 ? lim - s.round : 99;

  if (s.phase === 'auction' && s.auction) {
    const au = s.auction, v = worth2(s, a, au.tile) * 1.05, picks: number[] = [];
    if (au.bid + (BID_STEPS[1] as number) <= v * 0.85) picks.push(mvBid(1));
    if (au.bid + (BID_STEPS[0] as number) <= v) picks.push(mvBid(0));
    return first(picks.filter((m) => cash - (au.bid + (BID_STEPS[m - 500] as number)) >= 30), MV.PASS);
  }
  if (s.phase === 'trade' && s.trade) {
    const tr = s.trade, gainV = tr.give >= 0 ? worth2(s, a, tr.give) : 0, lossV = tr.get >= 0 ? worth2(s, a, tr.get) : 0;
    if (tr.cash < 0 && cash + tr.cash < 100) return MV.REJECT;
    return gainV - lossV + tr.cash > 40 && ok(MV.ACCEPT) ? MV.ACCEPT : MV.REJECT;
  }
  if (s.phase === 'debt' && s.debt) {
    if (cash >= s.debt.amount) return MV.SETTLE;
    const need = s.debt.amount - cash;
    // 1) gadai petak yang tidak ikut set lengkap (paling sedikit merugikan), pilih yang pas menutup kebutuhan
    const light = mine.filter((t) => ok(mvMort(t)) && !(TILES[t]!.kind === 'prop' && fullSet(s, a, TILES[t]!.group))).sort((x, y) => TILES[x]!.price - TILES[y]!.price);
    const cover = light.find((t) => TILES[t]!.price / 2 >= need) ?? light[light.length - 1];
    if (cover !== undefined) return mvMort(cover);
    // 2) jual bangunan dari kawasan paling tinggi
    const sells = mine.filter((t) => canSell(s, a, t)).sort((x, y) => (s.lvl[y] as number) - (s.lvl[x] as number));
    const m1 = first(sells.map(mvSell), -1); if (m1 >= 0) return m1;
    // 3) terpaksa gadai sisanya
    const morts = mine.map(mvMort).filter(ok);
    if (morts.length) return morts.sort((x, y) => TILES[x - 300]!.price - TILES[y - 300]!.price)[0] as number;
    return MV.BANKRUPT;
  }
  if (s.phase === 'buy') {
    const t = s.pos[a] as number, tl = TILES[t] as (typeof TILES)[number], must = worth2(s, a, t) >= tl.price * 1.7;
    return cash >= tl.price && cash - tl.price >= (must ? 20 : reserveFor(s, a)) ? MV.BUY : MV.AUCTION;
  }
  if (s.phase === 'roll' && (s.jail[a] as number) > 0) {
    const heavy = oppBuildings(s, a) >= 6; // papan berbahaya: lebih aman tetap di penjara
    if (!heavy && ok(MV.USE_FREE)) return MV.USE_FREE;
    if (!heavy && cash > 500 && s.round < 16 && ok(MV.PAY_JAIL)) return MV.PAY_JAIL;
  }
  const res = reserveFor(s, a);
  // gadai petak lepas (bukan bagian set lengkap) bila itu membuat kita bisa membangun di set lengkap
  const wants = mine.filter((t) => TILES[t]!.kind === 'prop' && fullSet(s, a, TILES[t]!.group) && !s.mort[t] && (s.lvl[t] as number) < 3 && cash < (GROUPS[TILES[t]!.group] as { house: number }).house + 60);
  if (wants.length) {
    const loose = mine.filter((t) => ok(mvMort(t)) && !(TILES[t]!.kind === 'prop' && fullSet(s, a, TILES[t]!.group)) && (TILES[t]!.kind !== 'prop' || (GROUP_TILES[TILES[t]!.group] as number[]).filter((x) => s.owner[x] === a).length < 2))
      .sort((x, y) => TILES[y]!.price - TILES[x]!.price);
    if (loose.length) return mvMort(loose[0] as number);
  }
  // bangun: kawasan paling menguntungkan dulu, sampai 3 rumah sebelum meratakan ke hotel
  const builds = mine.filter((t) => canBuild(s, a, t)).map((t) => {
    const tl = TILES[t] as (typeof TILES)[number], l = s.lvl[t] as number, house = (GROUPS[tl.group] as { house: number }).house;
    const gain = ((tl.rent[l + 1] as number) - (tl.rent[l] as number)) / house;
    return { t, house, l, sc: gain * (GW[tl.group] as number) * evMul(s, t) * (l < 3 ? 1.5 : l === 4 ? 0.8 : 1) };
  }).filter((b) => cash - b.house >= Math.max(60, res * 0.7) + (b.l === 4 ? 150 : 0)).sort((x, y) => y.sc - x.sc);
  if (builds.length) return mvBuild((builds[0] as { t: number }).t);
  if (left > 2) { // tebus gadai (set lengkap dulu); di akhir game berbatas putaran tidak lagi, karena tebus itu rugi 10%
    const full = (t: number) => Number(TILES[t]!.kind === 'prop' && fullSet(s, a, TILES[t]!.group));
    const un = mine.filter((t) => canUnmortgage(s, a, t) && cash - unmortCost(t) >= 300).sort((x, y) => full(y) - full(x));
    if (un.length) return mvUnmort(un[0] as number);
  }
  if (!s.tradedTurn && cash > 200 && r() < 0.4) { // berdagang: tukar atau beli satu petak penentu set
    for (let g = 0; g < GROUPS.length; g++) {
      const ts = GROUP_TILES[g] as number[], have = ts.filter((t) => s.owner[t] === a), miss = ts.filter((t) => s.owner[t] !== a);
      if (have.length !== ts.length - 1 || miss.length !== 1) continue;
      const t = miss[0] as number, q = s.owner[t] as number;
      if (q < 0 || !alive(s).includes(q) || fullSet(s, q, g)) continue;
      for (const u of mine) { // tukar: beri petak yang melengkapi set lawan itu, asal bukan petak yang hampir melengkapi set saya
        const ul = TILES[u] as (typeof TILES)[number]; if (ul.kind !== 'prop') continue;
        const ug = GROUP_TILES[ul.group] as number[];
        if (ug.filter((x) => s.owner[x] === a).length >= ug.length - 1) continue;
        if (ug.filter((x) => x !== u && s.owner[x] === q).length === ug.length - 1 && validTrade(s, a, q, u, t, 0)) return tradeMove(q, u, t, 0, false);
      }
      const amt = Math.min(round25(TILES[t]!.price * 1.7), Math.floor((cash - 120) / 25) * 25);
      if (amt < 25 || amt / 25 > 40) continue;
      if (validTrade(s, a, q, -1, t, amt)) return tradeMove(q, 40, t, amt / 25, false);
    }
  }
  return s.phase === 'roll' ? MV.ROLL : MV.END;
}

/** Pilihan langkah bot. level 0 = santai (hati-hati, tidak berdagang), 1 = cerdas. Langkah yang dikembalikan selalu sah. */
export function botMove(s: MonoState, level: 0 | 1 = 1): number {
  const m = level === 1 ? smartMove(s) : basicMove(s, 0);
  if (monopoly.apply(s, m) !== null) return m;
  return basicMove(s, level);
}
