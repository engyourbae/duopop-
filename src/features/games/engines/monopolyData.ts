/** Data papan "Monopoli Nusantara": 40 petak, 8 set warna, kartu Kejutan & Kas Warga, mode, bidak. Semua kustom. */
export type TileKind = 'go' | 'prop' | 'rail' | 'util' | 'chest' | 'chance' | 'tax' | 'jail' | 'park' | 'gojail';
export interface Tile { id: number; kind: TileKind; name: string; group: number; price: number; rent: number[]; util?: 'listrik' | 'air' }
export interface Group { name: string; color: string; house: number }

export const GROUPS: Group[] = [
  { name: 'Cokelat', color: '#8b5a3c', house: 50 }, { name: 'Biru Muda', color: '#4fb8e6', house: 50 },
  { name: 'Merah Muda', color: '#e8559a', house: 100 }, { name: 'Jingga', color: '#f28c28', house: 100 },
  { name: 'Merah', color: '#d7263d', house: 150 }, { name: 'Kuning', color: '#f4c430', house: 150 },
  { name: 'Hijau', color: '#2e9e5b', house: 200 }, { name: 'Biru Tua', color: '#2b4fd8', house: 200 },
];

const P = (id: number, name: string, group: number, price: number, rent: number[]): Tile => ({ id, kind: 'prop', name, group, price, rent });
const S = (id: number, kind: TileKind, name: string): Tile => ({ id, kind, name, group: -1, price: 0, rent: [] });
const R = (id: number, name: string): Tile => ({ id, kind: 'rail', name, group: -1, price: 200, rent: [25, 50, 100, 200] });
const U = (id: number, name: string, util: 'listrik' | 'air'): Tile => ({ id, kind: 'util', name, group: -1, price: 150, rent: [], util });

export const TILES: Tile[] = [
  S(0, 'go', 'MULAI'), P(1, 'Pasar Baru', 0, 60, [2, 10, 30, 90, 160, 250]), S(2, 'chest', 'Kas Warga'), P(3, 'Pasar Senen', 0, 60, [4, 20, 60, 180, 320, 450]),
  S(4, 'tax', 'Pajak Penghasilan'), R(5, 'Stasiun Gambir'), P(6, 'Malioboro', 1, 100, [6, 30, 90, 270, 400, 550]), S(7, 'chance', 'Kejutan'),
  P(8, 'Taman Sari', 1, 100, [6, 30, 90, 270, 400, 550]), P(9, 'Kota Tua', 1, 120, [8, 40, 100, 300, 450, 600]), S(10, 'jail', 'Penjara'),
  P(11, 'Braga', 2, 140, [10, 50, 150, 450, 625, 750]), U(12, 'Listrik PLN', 'listrik'), P(13, 'Dago', 2, 140, [10, 50, 150, 450, 625, 750]),
  P(14, 'Lembang', 2, 160, [12, 60, 180, 500, 700, 900]), R(15, 'Stasiun Tugu'), P(16, 'Tunjungan', 3, 180, [14, 70, 200, 550, 750, 950]),
  S(17, 'chest', 'Kas Warga'), P(18, 'Kayutangan', 3, 180, [14, 70, 200, 550, 750, 950]), P(19, 'Kembang Jepun', 3, 200, [16, 80, 220, 600, 800, 1000]),
  S(20, 'park', 'Parkir Bebas'), P(21, 'Jl. Thamrin', 4, 220, [18, 90, 250, 700, 875, 1050]), S(22, 'chance', 'Kejutan'),
  P(23, 'Jl. Sudirman', 4, 220, [18, 90, 250, 700, 875, 1050]), P(24, 'Jl. Kuningan', 4, 240, [20, 100, 300, 750, 925, 1100]), R(25, 'Stasiun Gubeng'),
  P(26, 'Ubud', 5, 260, [22, 110, 330, 800, 975, 1150]), P(27, 'Kuta', 5, 260, [22, 110, 330, 800, 975, 1150]), U(28, 'Air PDAM', 'air'),
  P(29, 'Sanur', 5, 280, [24, 120, 360, 850, 1025, 1200]), S(30, 'gojail', 'Masuk Penjara'), P(31, 'Raja Ampat', 6, 300, [26, 130, 390, 900, 1100, 1275]),
  P(32, 'Bunaken', 6, 300, [26, 130, 390, 900, 1100, 1275]), S(33, 'chest', 'Kas Warga'), P(34, 'Pulau Komodo', 6, 320, [28, 150, 450, 1000, 1200, 1400]),
  R(35, 'Stasiun Medan'), S(36, 'chance', 'Kejutan'), P(37, 'Borobudur', 7, 350, [35, 175, 500, 1100, 1300, 1500]),
  S(38, 'tax', 'Pajak Mewah'), P(39, 'Istana Nusantara', 7, 400, [50, 200, 600, 1400, 1700, 2000]),
];
export const TAX_AMT: Record<number, number> = { 4: 200, 38: 100 };
export const RAILS = TILES.filter((t) => t.kind === 'rail').map((t) => t.id);
export const UTILS = TILES.filter((t) => t.kind === 'util').map((t) => t.id);
export const GROUP_TILES: number[][] = GROUPS.map((_, g) => TILES.filter((t) => t.group === g && t.kind === 'prop').map((t) => t.id));
export const isOwnable = (t: Tile) => t.kind === 'prop' || t.kind === 'rail' || t.kind === 'util';

export type CardFx =
  | { t: 'move'; to: number } | { t: 'rail' } | { t: 'util' } | { t: 'back'; n: number }
  | { t: 'cash'; n: number } | { t: 'each'; n: number } | { t: 'repair'; h: number; H: number } | { t: 'jail' } | { t: 'free' };
export interface Card { text: string; fx: CardFx }
export const CHANCE: Card[] = [
  { text: 'Maju ke MULAI dan terima gaji.', fx: { t: 'move', to: 0 } },
  { text: 'Maju ke Jl. Kuningan. Lewat MULAI, ambil gaji.', fx: { t: 'move', to: 24 } },
  { text: 'Maju ke Braga. Lewat MULAI, ambil gaji.', fx: { t: 'move', to: 11 } },
  { text: 'Maju ke Istana Nusantara.', fx: { t: 'move', to: 39 } },
  { text: 'Naik kereta ke Stasiun Tugu. Lewat MULAI, ambil gaji.', fx: { t: 'move', to: 15 } },
  { text: 'Maju ke stasiun terdekat. Bayar sewa dua kali lipat bila ada pemiliknya.', fx: { t: 'rail' } },
  { text: 'Maju ke stasiun terdekat. Bayar sewa dua kali lipat bila ada pemiliknya.', fx: { t: 'rail' } },
  { text: 'Maju ke utilitas terdekat. Bayar 10 kali lemparan dadu bila ada pemiliknya.', fx: { t: 'util' } },
  { text: 'Dividen saham BUMN cair. Terima Rp50jt.', fx: { t: 'cash', n: 50 } },
  { text: 'Arisan RT kamu cair. Terima Rp150jt.', fx: { t: 'cash', n: 150 } },
  { text: 'Tilang parkir liar. Bayar Rp15jt.', fx: { t: 'cash', n: -15 } },
  { text: 'Kamu jadi ketua panitia dan traktir semua. Bayar Rp50jt ke tiap pemain.', fx: { t: 'each', n: -50 } },
  { text: 'Mundur 3 petak karena salah belok.', fx: { t: 'back', n: 3 } },
  { text: 'Renovasi massal. Bayar Rp25jt per rumah dan Rp100jt per hotel.', fx: { t: 'repair', h: 25, H: 100 } },
  { text: 'Razia! Langsung masuk Penjara tanpa lewat MULAI.', fx: { t: 'jail' } },
  { text: 'Kartu Bebas dari Penjara. Simpan sampai dipakai.', fx: { t: 'free' } },
];
export const CHEST: Card[] = [
  { text: 'Maju ke MULAI dan terima gaji.', fx: { t: 'move', to: 0 } },
  { text: 'Salah hitung bank menguntungkanmu. Terima Rp200jt.', fx: { t: 'cash', n: 200 } },
  { text: 'Biaya dokter. Bayar Rp50jt.', fx: { t: 'cash', n: -50 } },
  { text: 'Hasil jual saham. Terima Rp50jt.', fx: { t: 'cash', n: 50 } },
  { text: 'Kartu Bebas dari Penjara. Simpan sampai dipakai.', fx: { t: 'free' } },
  { text: 'Tertangkap parkir di zona terlarang. Masuk Penjara!', fx: { t: 'jail' } },
  { text: 'Hari ulang tahunmu. Terima Rp50jt dari tiap pemain.', fx: { t: 'each', n: 50 } },
  { text: 'Dana pensiun cair. Terima Rp100jt.', fx: { t: 'cash', n: 100 } },
  { text: 'Pengembalian pajak. Terima Rp20jt.', fx: { t: 'cash', n: 20 } },
  { text: 'Asuransi jiwa jatuh tempo. Terima Rp100jt.', fx: { t: 'cash', n: 100 } },
  { text: 'Biaya rumah sakit. Bayar Rp100jt.', fx: { t: 'cash', n: -100 } },
  { text: 'Uang sekolah anak. Bayar Rp50jt.', fx: { t: 'cash', n: -50 } },
  { text: 'Honor konsultan. Terima Rp25jt.', fx: { t: 'cash', n: 25 } },
  { text: 'Perbaikan jalan kompleks. Bayar Rp40jt per rumah dan Rp115jt per hotel.', fx: { t: 'repair', h: 40, H: 115 } },
  { text: 'Juara lomba 17 Agustus. Terima Rp10jt.', fx: { t: 'cash', n: 10 } },
  { text: 'Warisan keluarga. Terima Rp100jt.', fx: { t: 'cash', n: 100 } },
];

export type ModeKey = 'klasik' | 'cepat' | 'sultan';
export const MODES: Record<ModeKey, { label: string; cash: number; go: number; rounds: number; desc: string }> = {
  klasik: { label: 'Klasik', cash: 1500, go: 200, rounds: 0, desc: 'Uang Rp1.500jt. Main sampai tinggal satu pemain.' },
  cepat: { label: 'Kilat', cash: 1000, go: 200, rounds: 20, desc: 'Uang Rp1.000jt, 20 putaran. Kekayaan terbesar menang.' },
  sultan: { label: 'Sultan', cash: 3000, go: 300, rounds: 40, desc: 'Uang Rp3.000jt, gaji Rp300jt, 40 putaran.' },
};
export const JAIL_FEE = 50, JAIL_POS = 10, MAX_HOUSES = 32, MAX_HOTELS = 12;
export const PCOL = ['#e0401f', '#2a4bff', '#0f8f5f', '#ffc414', '#9c36b5', '#12b5cb'];
export const PAWNS = ['becak', 'pinisi', 'garuda', 'motor', 'kucing', 'tumpeng'] as const;
export const PAWN_NAME: Record<string, string> = { becak: 'Becak', pinisi: 'Kapal Pinisi', garuda: 'Garuda', motor: 'Motor', kucing: 'Kucing', tumpeng: 'Tumpeng' };
export const money = (n: number) => `Rp${n.toLocaleString('id-ID')}jt`;
