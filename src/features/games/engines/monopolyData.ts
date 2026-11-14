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
  { text: 'Maju ke {24}. Lewat MULAI, ambil gaji.', fx: { t: 'move', to: 24 } },
  { text: 'Maju ke {11}. Lewat MULAI, ambil gaji.', fx: { t: 'move', to: 11 } },
  { text: 'Maju ke {39}.', fx: { t: 'move', to: 39 } },
  { text: 'Berangkat ke {15}. Lewat MULAI, ambil gaji.', fx: { t: 'move', to: 15 } },
  { text: 'Maju ke {rail} terdekat. Bayar sewa dua kali lipat bila ada pemiliknya.', fx: { t: 'rail' } },
  { text: 'Maju ke {rail} terdekat. Bayar sewa dua kali lipat bila ada pemiliknya.', fx: { t: 'rail' } },
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

export type ModeKey = 'klasik' | 'cepat' | 'sultan' | 'bursa' | 'borneo' | 'sumatra';
export type BoardKey = 'nusantara' | 'borneo' | 'sumatra';
export interface ModeCfg { label: string; cash: number; go: number; rounds: number; desc: string; market?: boolean; pot?: boolean; board?: BoardKey }
export const MODES: Record<ModeKey, ModeCfg> = {
  klasik: { label: 'Klasik', cash: 1500, go: 200, rounds: 0, desc: 'Uang Rp1,5 M. Main sampai tinggal satu pemain.' },
  cepat: { label: 'Kilat', cash: 1000, go: 200, rounds: 20, desc: 'Uang Rp1 M, 20 putaran. Kekayaan terbesar menang.' },
  sultan: { label: 'Sultan', cash: 3000, go: 300, rounds: 40, desc: 'Uang Rp3 M, gaji Rp300jt, 40 putaran.' },
  bursa: { label: 'Bursa', cash: 1500, go: 200, rounds: 30, market: true, pot: true, desc: 'Event pasar mengubah sewa tiap beberapa putaran, dan semua pajak/denda masuk jackpot Parkir Bebas. 30 putaran, kekayaan terbesar menang.' },
  borneo: { label: 'Papan Borneo', cash: 1500, go: 200, rounds: 30, market: true, pot: true, board: 'borneo', desc: 'Keliling Kalimantan: wisata Kabupaten Landak (Rombo Dait, Riam Bedawan, Bukit Samabue, dan lainnya) sampai Kuala Behe sebagai petak termahal. Event pasar dan jackpot Parkir Bebas aktif. 30 putaran.' },
  sumatra: { label: 'Papan Sumatra', cash: 1500, go: 200, rounds: 30, market: true, pot: true, board: 'sumatra', desc: 'Keliling Sumatra dari Sabang sampai Danau Toba. Event pasar dan jackpot Parkir Bebas aktif. 30 putaran.' },
};
export const JAIL_FEE = 50, JAIL_POS = 10, MAX_HOUSES = 32, MAX_HOTELS = 12;
export const PCOL = ['#e0401f', '#2a4bff', '#0f8f5f', '#ffc414', '#9c36b5', '#12b5cb'];
export const PAWNS = ['becak', 'pinisi', 'garuda', 'motor', 'kucing', 'tumpeng'] as const;
export const PAWN_NAME: Record<string, string> = { becak: 'Becak', pinisi: 'Kapal Pinisi', garuda: 'Garuda', motor: 'Motor', kucing: 'Kucing', tumpeng: 'Tumpeng' };
/** Satuan dasar = juta rupiah. 1.000 juta = 1 M (miliar), 1.000.000 juta = 1 T (triliun). */
export const money = (n: number): string => {
  const a = Math.abs(n), sign = n < 0 ? '-' : '';
  const f = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  if (a >= 1_000_000) return `${sign}Rp${f(a / 1_000_000)} T`;
  if (a >= 1000) return `${sign}Rp${f(a / 1000)} M`;
  return `${sign}Rp${f(a)}jt`;
};

// ---------- Papan tema & event pasar ----------
export const BOARDS: Record<BoardKey, { title: string; rail: string; names: Record<number, string> }> = {
  nusantara: { title: 'Nusantara', rail: 'stasiun', names: {} },
  borneo: { title: 'Borneo', rail: 'pelabuhan atau bandara', names: {
    1: 'Pasar Ngabang', 3: 'Pasar Terapung', 5: 'Pelabuhan Dwikora', 6: 'Tugu Khatulistiwa', 8: 'Pantai Pasir Panjang', 9: 'Makam Juang Mandor',
    11: "Rombo Panga'a", 13: 'Riam Jejak Buru', 14: 'Sungai Mahakam', 15: 'Pelabuhan Trisakti', 16: 'Pasar Klandasan', 18: 'Riam Solakng', 19: 'Riam Terinting',
    21: 'Bukit Samabue', 23: 'Riam Bedawan', 24: 'Jl. Antasari', 25: 'Bandara Sepinggan', 26: 'Pulau Derawan', 27: 'Pulau Maratua', 29: 'Pulau Kakaban',
    31: 'Tanjung Puting', 32: 'Betung Kerihun', 34: 'Rombo Dait', 35: 'Bandara Supadio', 37: 'IKN Nusantara', 39: 'Kuala Behe (Merbe)' } },
  sumatra: { title: 'Sumatra', rail: 'pelabuhan atau bandara', names: {
    1: 'Pasar Atas', 3: 'Pasar 16 Ilir', 5: 'Pelabuhan Belawan', 6: 'Jam Gadang', 8: 'Ngarai Sianok', 9: 'Kota Padang',
    11: 'Pantai Air Manis', 13: 'Danau Maninjau', 14: 'Lembah Harau', 15: 'Bandara Kualanamu', 16: 'Jembatan Ampera', 18: 'Pulau Kemaro', 19: 'Benteng Kuto Besak',
    21: 'Jl. Imam Bonjol', 23: 'Jl. Sudirman', 24: 'Jl. Gatot Subroto', 25: 'Pelabuhan Bakauheni', 26: 'Pulau Weh', 27: 'Pantai Sabang', 29: 'Pulau Banyak',
    31: 'Danau Toba', 32: 'Pulau Samosir', 34: 'Kepulauan Mentawai', 35: 'Bandara Minangkabau', 37: 'Candi Muaro Jambi', 39: 'Masjid Baiturrahman' } },
};
const BASE_NAMES = TILES.map((t) => t.name);
let activeBoard: BoardKey = 'nusantara';
/** Ganti nama petak sesuai papan mode (struktur, harga, dan sewa tetap sama sehingga mesin & bot tidak berubah). */
export function applyBoard(mode: ModeKey): void {
  const b = MODES[mode].board ?? 'nusantara';
  if (b === activeBoard) return;
  activeBoard = b;
  TILES.forEach((t, i) => { t.name = BOARDS[b].names[i] ?? (BASE_NAMES[i] as string); });
}
export const boardTitle = (mode: ModeKey) => BOARDS[MODES[mode].board ?? 'nusantara'].title;
/** Teks kartu dengan nama petak/jenis angkutan sesuai papan aktif. */
export const cardText = (c: Card) => c.text.replace(/\{(\d+)\}/g, (_, n: string) => TILES[Number(n)]?.name ?? '').replace('{rail}', BOARDS[activeBoard].rail);

export interface MarketEv { title: string; desc: string; pct: (t: Tile) => number }
const inGroups = (t: Tile, g: number[], p: number) => (t.kind === 'prop' && g.includes(t.group) ? p : 100);
/** Event pasar (mode Bursa): mengubah persentase sewa selama 2 putaran. */
export const MARKET: MarketEv[] = [
  { title: 'Musim Liburan', desc: 'Sewa petak wisata (Kuning, Hijau, Biru Tua) naik 50%.', pct: (t) => inGroups(t, [5, 6, 7], 150) },
  { title: 'Wisata Sepi', desc: 'Sewa petak wisata (Kuning, Hijau, Biru Tua) turun 40%.', pct: (t) => inGroups(t, [5, 6, 7], 60) },
  { title: 'Banjir Besar', desc: 'Sewa kawasan murah (Cokelat, Biru Muda) turun 40%.', pct: (t) => inGroups(t, [0, 1], 60) },
  { title: 'Festival Kota', desc: 'Sewa kawasan Merah Muda dan Jingga naik 50%.', pct: (t) => inGroups(t, [2, 3], 150) },
  { title: 'Pembangunan CBD', desc: 'Sewa kawasan Merah naik 60%.', pct: (t) => inGroups(t, [4], 160) },
  { title: 'Proyek Tol Baru', desc: 'Sewa stasiun/pelabuhan/bandara dua kali lipat.', pct: (t) => (t.kind === 'rail' ? 200 : 100) },
  { title: 'Tarif Listrik & Air Naik', desc: 'Sewa listrik dan air dua kali lipat.', pct: (t) => (t.kind === 'util' ? 200 : 100) },
  { title: 'Resesi', desc: 'Semua sewa turun 25%.', pct: () => 75 },
  { title: 'Ledakan Properti', desc: 'Semua sewa naik 25%.', pct: () => 125 },
];
export const marketPct = (id: number, t: Tile) => MARKET[id]?.pct(t) ?? 100;
