import type { ChoiceQuestion, Difficulty, EstimateQuestion, OrderQuestion } from '../../types';

const base = { language: 'id' as const, sourceTitle: '', sourceUrl: '', verifiedAt: null, contentVersion: 1, status: 'perlu-tinjauan' as const };
const E: Difficulty = 'mudah', M: Difficulty = 'sedang', H: Difficulty = 'sulit';

export const MYTH_OPTIONS = ['Fakta', 'Mitos', 'Belum cukup bukti'];
// [pernyataan, jawaban(0=Fakta,1=Mitos,2=Belum cukup bukti), kesulitan, penjelasan]
const myths: [string, 0 | 1 | 2, Difficulty, string][] = [
  ['Manusia hanya menggunakan 10% otaknya.', 1, E, 'Pencitraan otak menunjukkan hampir seluruh bagian otak aktif pada berbagai waktu.'],
  ['Petir tidak pernah menyambar tempat yang sama dua kali.', 1, E, 'Gedung tinggi seperti Empire State Building disambar petir berkali-kali.'],
  ['Madu yang disimpan dengan benar hampir tidak pernah basi.', 0, M, 'Kadar air rendah dan sifat asamnya menghambat pertumbuhan mikroba.'],
  ['Kelelawar itu buta.', 1, E, 'Kelelawar bisa melihat; banyak jenis juga memakai ekolokasi.'],
  ['Tembok Besar Tiongkok terlihat jelas dengan mata telanjang dari Bulan.', 1, M, 'Dari Bulan, struktur buatan manusia tidak terlihat jelas.'],
  ['Jantung berhenti sesaat ketika kita bersin.', 1, M, 'Jantung tetap berdetak; iramanya hanya bisa berubah sedikit.'],
  ['Pisang secara botani tergolong buah beri (berry).', 0, H, 'Berdasarkan definisi botani, pisang termasuk berry, sedangkan stroberi bukan.'],
  ['Lidah memiliki zona khusus untuk tiap rasa (peta lidah).', 1, M, 'Semua area lidah yang berperasa dapat mendeteksi kelima rasa dasar.'],
  ['Ikan mas hanya mengingat selama tiga detik.', 1, E, 'Penelitian menunjukkan ikan mas dapat mengingat selama berminggu-minggu.'],
  ['Manusia punya lebih dari lima indra.', 0, M, 'Ada pula indra keseimbangan, suhu, dan posisi tubuh.'],
  ['Mencukur rambut membuatnya tumbuh lebih tebal.', 1, E, 'Mencukur hanya memotong ujung rambut, tidak mengubah ketebalan akar.'],
  ['Bunglon berubah warna terutama untuk menyamar.', 1, H, 'Perubahan warna lebih terkait komunikasi, suhu, dan suasana hati.'],
  ['Candi Borobudur disusun tanpa semen; batunya saling mengunci.', 0, M, 'Batu andesitnya dirangkai dengan sistem kunci tanpa perekat.'],
  ['Banteng marah karena warna merah.', 1, M, 'Banteng tidak dapat membedakan merah; gerakan kain yang memancing mereka.'],
  ['Gula membuat anak menjadi hiperaktif.', 1, H, 'Uji terkontrol tidak menemukan hubungan sebab-akibat yang meyakinkan.'],
  ['Berenang setelah makan pasti menyebabkan kram fatal.', 1, M, 'Tidak ada bukti kuat bahwa hal ini berbahaya bagi kebanyakan orang.'],
  ['Berbicara kepada tanaman membuatnya tumbuh jauh lebih baik.', 2, H, 'Bukti ilmiahnya lemah dan tidak konsisten.'],
  ['Cahaya (kilat) tiba lebih dulu daripada bunyi guntur.', 0, E, 'Cahaya merambat jauh lebih cepat daripada bunyi.'],
  ['Indonesia memiliki lebih dari 17.000 pulau.', 0, E, 'Jumlah resmi pulau Indonesia berkisar di atas 17.000.'],
  ['Sidik jari anak kembar identik sama persis.', 1, M, 'Sidik jari terbentuk dipengaruhi lingkungan rahim sehingga berbeda.'],
  ['Darah di pembuluh vena berwarna biru.', 1, E, 'Darah selalu merah; vena tampak biru karena cara cahaya menembus kulit.'],
  ['Bentuk Bumi bulat sempurna.', 1, M, 'Bumi sedikit pepat di kutub dan menggembung di khatulistiwa.'],
  ['Garis khatulistiwa melintasi kota Pontianak.', 0, E, 'Tugu Khatulistiwa Pontianak menandai garis lintang 0°.'],
  ['Memperdengarkan musik Mozart pada bayi membuatnya jauh lebih cerdas.', 2, H, 'Efek jangka panjangnya tidak terbukti kuat.'],
  ['Semut mampu mengangkat beban puluhan kali bobot tubuhnya.', 0, E, 'Struktur tubuh kecil memberi rasio kekuatan terhadap bobot yang besar.'],
  ['Kuku dan rambut terus tumbuh setelah seseorang meninggal.', 1, M, 'Kulit menyusut sehingga tampak lebih panjang; pertumbuhan sel berhenti.'],
  ['Lumba-lumba termasuk mamalia.', 0, E, 'Lumba-lumba bernapas dengan paru-paru dan menyusui anaknya.'],
  ['Mandi petir dalam rumah tidak berbahaya selama ada atap.', 1, H, 'Petir dapat merambat lewat pipa dan kabel; sebaiknya hindari air saat badai.'],
  ['Hanya sebagian kecil populasi manusia bisa menggulung lidah secara genetik sederhana.', 2, H, 'Dugaan pewarisan sederhana tidak didukung bukti kuat.'],
];

export const mythQuestions: ChoiceQuestion[] = myths.map((m, i) => ({
  ...base, id: `myth-${String(i + 1).padStart(3, '0')}`, category: 'mitos', subcategory: 'Fakta atau Mitos',
  difficulty: m[2], type: 'tf3', question: m[0], options: MYTH_OPTIONS, correctAnswer: m[1], explanation: m[3],
}));

// [pertanyaan, subkategori, kesulitan, [[peristiwa, tahun]...] dalam urutan benar]
const chronos: [string, string, Difficulty, [string, number][]][] = [
  ['Urutkan peristiwa pergerakan nasional ini dari yang paling awal.', 'Indonesia', E, [['Budi Utomo berdiri', 1908], ['Sumpah Pemuda', 1928], ['Proklamasi Kemerdekaan', 1945], ['Pemilu pertama', 1955]]],
  ['Urutkan dari yang paling awal.', 'Indonesia', M, [['Proklamasi Kemerdekaan', 1945], ['Konferensi Asia Afrika', 1955], ['Supersemar', 1966], ['Reformasi', 1998]]],
  ['Urutkan kerajaan/kesultanan berdasarkan masa kejayaan awalnya.', 'Nusantara', H, [['Sriwijaya (abad ke-7)', 683], ['Majapahit berdiri', 1293], ['Demak berdiri', 1475], ['Mataram Islam berdiri', 1587]]],
  ['Urutkan peristiwa dunia berikut.', 'Dunia', M, [['Revolusi Prancis', 1789], ['Perang Dunia I dimulai', 1914], ['Perang Dunia II dimulai', 1939], ['Runtuhnya Tembok Berlin', 1989]]],
  ['Urutkan dari yang paling awal.', 'Dunia', M, [['Columbus tiba di Amerika', 1492], ['Deklarasi Kemerdekaan AS', 1776], ['Revolusi Prancis', 1789], ['Kongres Wina', 1815]]],
  ['Urutkan dari yang paling awal.', 'Dunia', M, [['Pendaratan di Bulan (Apollo 11)', 1969], ['Uni Soviet bubar', 1991], ['Serangan 11 September', 2001], ['WHO menyatakan pandemi COVID-19', 2020]]],
  ['Urutkan penemuan sains ini.', 'Sains', H, [['Principia Newton', 1687], ['Relativitas khusus Einstein', 1905], ['Penemuan penisilin', 1928], ['Struktur DNA diusulkan', 1953]]],
  ['Urutkan inovasi teknologi ini.', 'Teknologi', M, [['Telepon Bell dipatenkan', 1876], ['Penerbangan Wright bersaudara', 1903], ['Web terbuka untuk publik', 1991], ['iPhone pertama dirilis', 2007]]],
  ['Urutkan dari yang paling awal.', 'Indonesia', M, [['Perang Diponegoro dimulai', 1825], ['Budi Utomo berdiri', 1908], ['Sumpah Pemuda', 1928], ['Pertempuran Surabaya', 1945]]],
  ['Urutkan dari yang paling awal.', 'Dunia', H, [['Olimpiade kuno pertama', -776], ['Romawi Barat runtuh', 476], ['Konstantinopel jatuh', 1453], ['Reformasi Protestan', 1517]]],
  ['Urutkan dari yang paling awal.', 'Dunia', H, [['Magna Carta', 1215], ['Konstantinopel jatuh', 1453], ['Reformasi Protestan', 1517], ['Revolusi Industri bermula (±)', 1760]]],
  ['Urutkan eksplorasi antariksa ini.', 'Antariksa', M, [['Sputnik 1 diluncurkan', 1957], ['Gagarin ke luar angkasa', 1961], ['Apollo 11 mendarat', 1969], ['Modul ISS pertama diluncurkan', 1998]]],
  ['Urutkan era pemerintahan Indonesia.', 'Indonesia', M, [['Proklamasi Kemerdekaan', 1945], ['Dekret Presiden', 1959], ['Supersemar', 1966], ['Reformasi', 1998]]],
  ['Urutkan dari yang paling awal.', 'Indonesia', H, [['Kesultanan Pontianak berdiri', 1771], ['Perang Diponegoro dimulai', 1825], ['Budi Utomo berdiri', 1908], ['Proklamasi Kemerdekaan', 1945]]],
];

export const orderQuestions: OrderQuestion[] = chronos.map((c, i) => ({
  ...base, id: `kron-${String(i + 1).padStart(3, '0')}`, category: 'kronologi', subcategory: c[1], difficulty: c[2], type: 'order',
  question: c[0], options: c[3].map((e) => e[0]), years: c[3].map((e) => e[1]), correctAnswer: c[3].map((_, k) => k),
  explanation: c[3].map((e) => `${e[0]}: ${e[1] < 0 ? Math.abs(e[1]) + ' SM' : e[1]}`).join(' → '),
}));

// Tebak Era: diturunkan otomatis dari peristiwa bertahun pada soal kronologi (unik per peristiwa).
export const ERAS = ['Sebelum 1500', '1500–1799', '1800–1899', '1900–1945', 'Setelah 1945'];
export const eraOf = (y: number) => (y < 1500 ? 0 : y < 1800 ? 1 : y < 1900 ? 2 : y <= 1945 ? 3 : 4);
const seenEv = new Set<string>();
export const eraQuestions: ChoiceQuestion[] = [];
for (const c of chronos) for (const [name, year] of c[3]) {
  const key = name.replace(/ \(.*\)/, '');
  if (seenEv.has(key)) continue;
  seenEv.add(key);
  const k = eraQuestions.length + 1;
  eraQuestions.push({
    ...base, id: `era-${String(k).padStart(3, '0')}`, category: 'kronologi', subcategory: 'Tebak Era', difficulty: M, type: 'mcq',
    question: `“${name}” terjadi pada periode…`, options: [ERAS[eraOf(year)] as string, ...ERAS.filter((_, ix) => ix !== eraOf(year))].slice(0, 4),
    correctAnswer: 0, explanation: `${name} terjadi sekitar tahun ${year < 0 ? Math.abs(year) + ' SM' : year}.`,
  });
}

// [pertanyaan, jawaban, satuan, kesulitan, penjelasan]
const ests: [string, number, string, Difficulty, string][] = [
  ['Berapa tinggi Gunung Everest?', 8849, 'meter', M, 'Pengukuran bersama Nepal–Tiongkok (2020) menetapkan sekitar 8.848,86 m.'],
  ['Berapa tinggi Puncak Jaya?', 4884, 'meter', H, 'Puncak Jaya adalah titik tertinggi Indonesia.'],
  ['Berapa jumlah tulang manusia dewasa?', 206, 'tulang', E, 'Bayi memiliki lebih banyak tulang yang menyatu seiring tumbuh.'],
  ['Berapa panjang Sungai Kapuas (perkiraan)?', 1143, 'km', H, 'Kapuas adalah sungai terpanjang di Indonesia.'],
  ['Berapa jarak rata-rata Bumi ke Bulan?', 384400, 'km', M, 'Jarak ini berubah karena orbit Bulan elips.'],
  ['Berapa kecepatan cahaya di ruang hampa?', 299792, 'km/detik', M, 'Nilai pastinya 299.792,458 km/detik.'],
  ['Berapa usia Bumi (miliar tahun)?', 4.5, 'miliar tahun', M, 'Perkiraan ilmiah sekitar 4,54 miliar tahun.'],
  ['Berapa jumlah negara anggota PBB?', 193, 'negara', M, 'Anggota PBB berjumlah 193 negara.'],
  ['Berapa tinggi Monumen Nasional (Monas)?', 132, 'meter', M, 'Tinggi Monas sekitar 132 m.'],
  ['Berapa tinggi Menara Eiffel (termasuk antena)?', 330, 'meter', H, 'Tingginya sekitar 330 m dengan antena.'],
  ['Berapa persen tubuh manusia dewasa berupa air (perkiraan)?', 60, 'persen', M, 'Rata-rata kira-kira 50–65 persen.'],
  ['Berapa jumlah gigi permanen manusia dewasa (lengkap)?', 32, 'gigi', E, 'Termasuk empat gigi geraham bungsu.'],
  ['Berapa kedalaman Palung Mariana (perkiraan)?', 10900, 'meter', H, 'Titik terdalam Challenger Deep sekitar 10.900 m.'],
  ['Berapa kira-kira penduduk Indonesia (juta jiwa)?', 280, 'juta jiwa', M, 'Kisaran 280 juta jiwa pada pertengahan 2020-an.'],
  ['Berapa panjang Tembok Besar Tiongkok menurut survei 2012 (km)?', 21196, 'km', H, 'Survei resmi mengukur total sekitar 21.196 km.'],
  ['Berapa suhu normal tubuh manusia?', 37, '°C', E, 'Rata-rata sekitar 36,5–37,5 °C.'],
];
export const estimateQuestions: EstimateQuestion[] = ests.map((e, i) => ({
  ...base, id: `est-${String(i + 1).padStart(3, '0')}`, category: 'umum', subcategory: 'Estimasi', difficulty: e[3], type: 'estimate',
  question: e[0], options: [], correctAnswer: e[1], unit: e[2], explanation: e[4],
}));
