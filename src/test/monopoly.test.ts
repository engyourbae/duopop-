import { monopoly, rollDice, rentFor, canBuild, canMortgage, decodeTrade, tradeMove, netWorth, challengeXp, modeSeed, MV, mvBuild, mvMort, mvUnmort, mvBid, type MonoState } from '../features/games/engines/monopoly';
import { botMove } from '../features/games/engines/monopolyBot';
import { replayTurns } from '../features/games/engines/types';
import { TILES, GROUPS, CHANCE, CHEST, GROUP_TILES, MODES, MARKET, cardText, money } from '../features/games/engines/monopolyData';
import { GAMES, gameById, withVariant } from '../features/games/registry';
import { roomCapacity, roomKind } from '../features/multiplayer/rounds';

const fresh = (n = 3, mode = 'klasik', seed = 't') => monopoly.init(n, `${seed}~${mode}`);
const patch = (s: MonoState, p: Partial<MonoState>): MonoState => ({ ...s, cash: s.cash.slice(), pos: s.pos.slice(), jail: s.jail.slice(), free: s.free.slice(), owner: s.owner.slice(), lvl: s.lvl.slice(), mort: s.mort.slice(), ...p });
/** Seed yang pada lemparan pertama menghasilkan jumlah tertentu tanpa kembar. */
const seedFor = (sum: number) => { for (let i = 0; i < 5000; i++) { const d = rollDice(`k${i}`, 0); if (d[0] + d[1] === sum && d[0] !== d[1]) return `k${i}`; } throw new Error('seed tidak ketemu'); };

describe('data papan', () => {
  it('40 petak, 22 properti, 4 stasiun, 2 utilitas, kartu 16+16', () => {
    expect(TILES.length).toBe(40); expect(TILES.filter((t) => t.kind === 'prop').length).toBe(22); expect(TILES.filter((t) => t.kind === 'rail').length).toBe(4);
    expect(TILES.filter((t) => t.kind === 'util').length).toBe(2); expect(CHANCE.length).toBe(16); expect(CHEST.length).toBe(16);
    expect(GROUP_TILES.map((g) => g.length)).toEqual([2, 3, 3, 3, 3, 3, 3, 2]); expect(GROUPS.length).toBe(8);
    TILES.forEach((t, i) => expect(t.id).toBe(i));
  });
});
describe('mesin Monopoli', () => {
  it('deterministik per seed dan mode mengatur uang awal', () => {
    expect(fresh()).toEqual(fresh()); expect(fresh(3, 'klasik', 'a').chance).not.toEqual(fresh(3, 'klasik', 'b').chance);
    expect(fresh(2, 'klasik').cash).toEqual([1500, 1500]); expect(fresh(2, 'cepat').cash[0]).toBe(1000); expect(fresh(2, 'sultan').cash[0]).toBe(3000);
    expect(modeSeed({ mechanic: 'monopoly', bank: 'cepat' }, 'x')).toBe('x~cepat'); expect(modeSeed({ mechanic: 'uno' }, 'x')).toBe('x');
  });
  it('lempar dadu menggerakkan bidak lalu muncul fase beli', () => {
    const seed = seedFor(6), s = monopoly.init(2, `${seed}~klasik`), r = monopoly.apply(s, MV.ROLL)!;
    expect(r.pos[0]).toBe(6); expect(r.phase).toBe('buy'); expect(monopoly.apply(s, MV.BUY)).toBeNull();
    const b = monopoly.apply(r, MV.BUY)!; expect(b.owner[6]).toBe(0); expect(b.cash[0]).toBe(1400); expect(b.phase).toBe('end');
    const e = monopoly.apply(b, MV.END)!; expect(e.cur).toBe(1); expect(e.phase).toBe('roll');
  });
  it('lewat MULAI memberi gaji', () => {
    const seed = seedFor(4), s = patch(monopoly.init(2, `${seed}~klasik`), {}); s.pos[0] = 37;
    const r = monopoly.apply(s, MV.ROLL)!; expect(r.pos[0]).toBe(1); expect(r.stats[0]!.passGo).toBe(1);
  });
  it('sewa: set penuh ganda, rumah, stasiun, utilitas', () => {
    let s = fresh(2); s = patch(s, {}); s.owner[1] = 0;
    expect(rentFor(s, 1, 7)).toBe(2); s.owner[3] = 0; expect(rentFor(s, 1, 7)).toBe(4); s.lvl[1] = 2; expect(rentFor(s, 1, 7)).toBe(30);
    s.owner[5] = 0; expect(rentFor(s, 5, 7)).toBe(25); s.owner[15] = 0; expect(rentFor(s, 5, 7)).toBe(50);
    s.owner[12] = 0; expect(rentFor(s, 12, 8)).toBe(32); s.owner[28] = 0; expect(rentFor(s, 12, 8)).toBe(80); s.mort[12] = true; expect(rentFor(s, 12, 8)).toBe(0);
  });
  it('membangun: perlu set penuh, merata, uang cukup', () => {
    let s = fresh(2); s = patch(s, {}); s.owner[1] = 0;
    expect(canBuild(s, 0, 1)).toBe(false); s.owner[3] = 0; expect(canBuild(s, 0, 1)).toBe(true);
    const a = monopoly.apply(s, mvBuild(1))!; expect(a.lvl[1]).toBe(1); expect(a.cash[0]).toBe(1450);
    expect(monopoly.apply(a, mvBuild(1))).toBeNull(); const b = monopoly.apply(a, mvBuild(3))!; expect(b.lvl[3]).toBe(1);
    s.lvl[1] = 4; s.lvl[3] = 4; const h = monopoly.apply(s, mvBuild(1))!; expect(h.lvl[1]).toBe(5);
  });
  it('gadai dan tebus', () => {
    let s = fresh(2); s = patch(s, {}); s.owner[6] = 0;
    const m = monopoly.apply(s, mvMort(6))!; expect(m.mort[6]).toBe(true); expect(m.cash[0]).toBe(1550);
    const u = monopoly.apply(m, mvUnmort(6))!; expect(u.mort[6]).toBe(false); expect(u.cash[0]).toBe(1550 - 55);
    s.owner[1] = 0; s.owner[3] = 0; s.lvl[1] = 1; expect(canMortgage(s, 0, 3)).toBe(false);
  });
  it('lelang: tawar, lewati, terjual ke penawar tertinggi', () => {
    const seed = seedFor(6), s0 = monopoly.apply(monopoly.init(3, `${seed}~klasik`), MV.ROLL)!, a = monopoly.apply(s0, MV.AUCTION)!;
    expect(a.phase).toBe('auction'); expect(monopoly.actor(a)).toBe(0);
    const b = monopoly.apply(a, mvBid(1))!; expect(b.auction!.bid).toBe(50); expect(monopoly.actor(b)).toBe(1);
    const c = monopoly.apply(b, mvBid(2))!; expect(c.auction!.bid).toBe(150); expect(monopoly.actor(c)).toBe(2);
    const d = monopoly.apply(c, MV.PASS)!, e = monopoly.apply(d, MV.PASS)!;
    expect(e.owner[6]).toBe(1); expect(e.cash[1]).toBe(1350); expect(e.phase).toBe('end'); expect(e.auction).toBeNull();
  });
  it('lelang tanpa penawar: tidak laku', () => {
    const seed = seedFor(6); let s = monopoly.apply(monopoly.apply(monopoly.init(2, `${seed}~klasik`), MV.ROLL)!, MV.AUCTION)!;
    s = monopoly.apply(s, MV.PASS)!; s = monopoly.apply(s, MV.PASS)!; expect(s.owner[6]).toBe(-1); expect(s.phase).toBe('end');
  });
  it('utang: harus menjual/menggadai atau bangkrut', () => {
    const seed = seedFor(4), s0 = monopoly.init(2, `${seed}~klasik`); s0.cash[0] = 50;
    const d = monopoly.apply(s0, MV.ROLL)!; expect(d.phase).toBe('debt'); expect(d.debt!.amount).toBe(200);
    expect(monopoly.apply(d, MV.SETTLE)).toBeNull(); expect(monopoly.apply(d, MV.END)).toBeNull();
    const p = patch(d, {}); p.owner[1] = 0; const m = monopoly.apply(d, mvMort(1)); expect(m).toBeNull(); // bukan miliknya
    p.owner[1] = 0; p.owner[3] = 0; const q = patch(p, { cur: 0 }); q.owner[1] = 0; q.owner[3] = 0;
    q.cash[0] = 50; const z = monopoly.apply(q, MV.BANKRUPT)!; expect(z.out[0]).toBe(true); expect(z.win).toBe(1);
    const e = patch(d, {}); e.owner[6] = 0; e.owner[8] = 0; e.owner[9] = 0; const m1 = monopoly.apply(e, mvMort(6))!, m2 = monopoly.apply(m1, mvMort(8))!, m3 = monopoly.apply(m2, mvMort(9))!;
    expect(m3.cash[0]).toBe(50 + 50 + 50 + 60); const ok = monopoly.apply(m3, MV.SETTLE)!; expect(ok.phase).toBe('end'); expect(ok.cash[0]).toBe(10);
  });
  it('bangkrut ke lawan memindahkan aset ke kreditur', () => {
    const s = fresh(3); s.owner[6] = 0; s.cash[0] = 20; const d = patch(s, { phase: 'debt', debt: { to: 1, amount: 300, per: 0 }, cash: [20, 1500, 1500] });
    const r = monopoly.apply(d, MV.BANKRUPT)!; expect(r.owner[6]).toBe(1); expect(r.cash[1]).toBe(1520); expect(r.cur).toBe(1); expect(r.win).toBe(-1);
  });
  it('penjara: bayar denda dan kartu bebas', () => {
    const s = patch(fresh(2), { jail: [1, 0], free: [1, 0] });
    const a = monopoly.apply(s, MV.PAY_JAIL)!; expect(a.jail[0]).toBe(0); expect(a.cash[0]).toBe(1450);
    const b = monopoly.apply(s, MV.USE_FREE)!; expect(b.jail[0]).toBe(0); expect(b.free[0]).toBe(0); expect(monopoly.apply(fresh(2), MV.PAY_JAIL)).toBeNull();
  });
  it('masuk penjara lewat petak Masuk Penjara', () => {
    const seed = seedFor(4), s = monopoly.init(2, `${seed}~klasik`); s.pos[0] = 26;
    const r = monopoly.apply(s, MV.ROLL)!; expect(r.pos[0]).toBe(10); expect(r.jail[0]).toBe(1); expect(r.phase).toBe('end');
  });
  it('dagang: kodekan, tawarkan, terima', () => {
    expect(decodeTrade(tradeMove(2, 5, 40, 7, true))).toEqual({ to: 2, give: 5, get: -1, cash: -175 });
    const s = patch(fresh(2), {}); s.owner[1] = 0; s.owner[3] = 1;
    const o = monopoly.apply(s, tradeMove(1, 1, 3, 2, false))!; expect(o.phase).toBe('trade'); expect(monopoly.actor(o)).toBe(1);
    const ok = monopoly.apply(o, MV.ACCEPT)!; expect(ok.owner[1]).toBe(1); expect(ok.owner[3]).toBe(0); expect(ok.cash[0]).toBe(1450); expect(ok.cash[1]).toBe(1550); expect(ok.phase).toBe('roll');
    const no = monopoly.apply(o, MV.REJECT)!; expect(no.owner[1]).toBe(0); expect(monopoly.apply(s, tradeMove(1, 3, 40, 0, false))).toBeNull();
  });
  it('batas putaran: mode Kilat berakhir dan kekayaan terbesar menang', () => {
    const s = patch(fresh(2, 'cepat'), { round: 20, phase: 'end', cur: 1 }); s.cash[0] = 1200;
    const r = monopoly.apply(s, MV.END)!; expect(r.win).toBe(0); expect(netWorth(r, 0)).toBeGreaterThan(netWorth(r, 1));
  });
  it('tantangan memberi XP bila selesai', () => {
    const s = patch(fresh(2), {}); expect(challengeXp(s, 0)).toBe(0); s.owner[1] = 0; s.owner[3] = 0; expect(challengeXp(s, 0)).toBe(10);
  });
});
describe('bot dan replay online', () => {
  it('bot selalu memilih langkah sah dan permainan Kilat selesai', () => {
    for (const n of [2, 4, 6]) for (let g = 0; g < 4; g++) {
      let s = monopoly.init(n, `b${g}~cepat`), k = 0;
      while (s.win < 0 && k < 4000) { const nx = monopoly.apply(s, botMove(s, (g % 2) as 0 | 1)); expect(nx).not.toBeNull(); s = nx!; k++; }
      expect(s.win).toBeGreaterThanOrEqual(0);
    }
  });
  it('replay langkah (online) menghasilkan keadaan yang sama', () => {
    const uids = ['a', 'b', 'c'], seed = 'rr~klasik', moves: { uid: string; choice: number }[] = [];
    let s = monopoly.init(3, seed);
    for (let k = 0; k < 300 && s.win < 0; k++) { const m = botMove(s, 1); moves.push({ uid: uids[monopoly.actor(s)]!, choice: m }); s = monopoly.apply(s, m)!; }
    moves.splice(5, 0, { uid: uids[(monopoly.actor(monopoly.init(3, seed)) + 1) % 3]!, choice: MV.ROLL }); // langkah liar dari pemain bukan giliran diabaikan
    const r = replayTurns(monopoly, uids, seed, moves);
    expect(r.s.cash).toEqual(s.cash); expect(r.s.owner).toEqual(s.owner); expect(r.s.pos).toEqual(s.pos);
  });
});
describe('registrasi', () => {
  it('Monopoli terdaftar: 1–6 pemain, online giliran, varian mode', () => {
    const g = gameById('monopoli')!; expect(g).toBeTruthy(); expect(GAMES.filter((x) => x.id === 'monopoli').length).toBe(1);
    expect(g.minPlayers).toBe(1); expect(g.maxPlayers).toBe(6); expect(g.multiplayer).toBe(true); expect(g.offline).toBe(true);
    expect(roomKind(g)).toBe('turn'); expect(roomCapacity(g)).toBe(6);
    expect(withVariant(g, 'cepat').bank).toBe('cepat'); expect(withVariant(g, undefined).bank).toBe('klasik');
  });
});
describe('format uang', () => {
  it('juta, miliar, triliun', () => {
    expect(money(60)).toBe('Rp60jt'); expect(money(1000)).toBe('Rp1 M'); expect(money(1500)).toBe('Rp1,5 M'); expect(money(3000)).toBe('Rp3 M');
    expect(money(1050)).toBe('Rp1,05 M'); expect(money(2000000)).toBe('Rp2 T'); expect(money(-250)).toBe('-Rp250jt');
  });
});

describe('upgrade: Bursa, papan tema, event pasar, jackpot', () => {
  it('mode baru dan papan Borneo/Sumatra mengganti nama petak, struktur tetap, klasik mengembalikan', () => {
    const b = fresh(2, 'bursa'); expect(b.cash[0]).toBe(1500); expect(b.mk).toBe(-1); expect(b.pot).toBe(0); expect(MODES.bursa.rounds).toBe(30);
    fresh(2, 'borneo'); expect(TILES[39]!.name).toBe('Kuala Behe (Merbe)'); expect(TILES[39]!.price).toBe(400); expect(TILES.length).toBe(40);
    expect(TILES[34]!.name).toBe('Rombo Dait'); expect(TILES[23]!.name).toBe('Riam Bedawan'); expect(cardText(CHANCE[3]!)).toBe('Maju ke Kuala Behe (Merbe).'); fresh(2, 'sumatra'); expect(TILES[31]!.name).toBe('Danau Toba');
    fresh(2, 'klasik'); expect(TILES[39]!.name).toBe('Istana Nusantara'); expect(cardText(CHANCE[3]!)).toBe('Maju ke Istana Nusantara.');
    expect(cardText(CHANCE[5]!)).toBe('Maju ke stasiun terdekat. Bayar sewa dua kali lipat bila ada pemiliknya.');
  });
  it('event pasar mengubah sewa; tanpa event sewa normal', () => {
    const s = fresh(2, 'bursa'); s.owner[37] = 0; expect(rentFor(s, 37, 7)).toBe(35);
    s.mk = 0; expect(rentFor(s, 37, 7)).toBe(Math.round(35 * 1.5)); s.mk = 8; expect(rentFor(s, 37, 7)).toBe(44); s.mk = 7; expect(rentFor(s, 37, 7)).toBe(26);
    s.mk = 2; s.owner[1] = 0; expect(rentFor(s, 1, 7)).toBe(1); s.mk = 0; expect(rentFor(s, 1, 7)).toBe(2); expect(MARKET.length).toBe(9);
  });
  it('pajak masuk jackpot dan mendarat di Parkir Bebas mengambilnya (hanya mode berjackpot)', () => {
    const tax = monopoly.apply(monopoly.init(2, `${seedFor(4)}~bursa`), MV.ROLL)!; expect(tax.pos[0]).toBe(4); expect(tax.pot).toBe(200); expect(tax.cash[0]).toBe(1300);
    const kl = monopoly.apply(monopoly.init(2, `${seedFor(4)}~klasik`), MV.ROLL)!; expect(kl.pot).toBe(0); expect(kl.cash[0]).toBe(1300);
    const s = monopoly.init(2, `${seedFor(6)}~bursa`); s.pot = 300; s.pos[0] = 14;
    const r = monopoly.apply(s, MV.ROLL)!; expect(r.pos[0]).toBe(20); expect(r.cash[0]).toBe(1800); expect(r.pot).toBe(0); expect(r.phase).toBe('end');
    const k = monopoly.init(2, `${seedFor(6)}~klasik`); k.pos[0] = 14; expect(monopoly.apply(k, MV.ROLL)!.cash[0]).toBe(1500);
  });
  it('permainan bot di mode Bursa/Borneo/Sumatra selesai, event pasar muncul, tanpa langkah ilegal', () => {
    for (const mode of ['bursa', 'borneo', 'sumatra']) {
      let s = monopoly.init(3, `sim1~${mode}`), steps = 0, market = false, pot = false;
      while (s.win < 0 && steps < 4000) { const n = monopoly.apply(s, botMove(s, 1)); expect(n).not.toBeNull(); s = n!; steps++; if (s.mk >= 0) market = true; if (s.pot > 0) pot = true; }
      expect(s.win).toBeGreaterThanOrEqual(0); expect(market).toBeTruthy(); expect(pot).toBeTruthy();
    }
  });
});

describe('bot Monopoli yang ditingkatkan', () => {
  it('selalu memberi langkah sah di semua mode untuk kedua level', () => {
    for (const mode of ['klasik', 'cepat', 'sultan', 'bursa', 'borneo', 'sumatra']) for (const lv of [0, 1] as const) {
      let s = monopoly.init(3, `bt~${mode}`), steps = 0;
      while (s.win < 0 && steps < 1500) { const n = monopoly.apply(s, botMove(s, lv)); expect(n).not.toBeNull(); s = n!; steps++; }
    }
  });
});
