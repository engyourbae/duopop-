const raw = `abjad acara agama aktor alami ambil ampun angin angka antar arang arsip asing atlas badai bahan bakso balik bambu barat bebas belum benua benda besar betis bocah bukit bulan bunga buruk busuk butir
cabai canda capek cepat cerah cinta cuaca curam cukup dapur darah datar dekat dewan dunia dusun elang emosi empat fajar fakta fokus forum fosil gagah gajah garam garis gemuk gerak gigih gitar
hakim halus hamil harga harum hasil hebat hijau hutan hujan ingat intan istri jalan jejak jelas jeruk jujur kabar kaget kakak kapal kapas karet kasih kebun kecil kerja kuasa kursi lahir lampu layar
lebah lemah lemak lukis luwes makan malam mandi manis marah masak mawar medan merah mimpi minum muara mulut murah nafas nakal nanas nasib niaga nusa obral orang pagar pahit pakai pasar pasir patah
pedas pelan pesan petir pintu pisau pohon pulau pulsa punah putih puisi rajin ramai rawat rebus rindu risau rumah rusak sabun sakit salah salju sawah sayap sayur sedih segar sehat semut senja sinar
siang suara subuh surat susah tabah tahun taman tanah tanda tarik tebal tegas telur tenda tepat tetap tiang tikus tidur timur tinta tinju tugas tulis turun ulang untuk usaha utara wajah wangi warga warna waktu yakin yatim zaman`;
/** Kata 5 huruf untuk Tebak Kata Rahasia (tanpa duplikat). */
export const WORDS5: string[] = [...new Set(raw.split(/\s+/).filter((w) => w.length === 5 && /^[a-z]+$/.test(w)))];
/** [kata, petunjuk kategori] untuk Susun Huruf. */
export const ANAGRAMS: [string, string][] = [
  ['harimau', 'Hewan'], ['gajah', 'Hewan'], ['kucing', 'Hewan'], ['kambing', 'Hewan'], ['bebek', 'Hewan'], ['jerapah', 'Hewan'], ['buaya', 'Hewan'], ['kelinci', 'Hewan'], ['kerbau', 'Hewan'], ['monyet', 'Hewan'], ['merpati', 'Hewan'],
  ['mangga', 'Buah'], ['jeruk', 'Buah'], ['durian', 'Buah'], ['rambutan', 'Buah'], ['semangka', 'Buah'], ['pepaya', 'Buah'], ['nanas', 'Buah'], ['anggur', 'Buah'], ['pisang', 'Buah'], ['salak', 'Buah'],
  ['jakarta', 'Kota'], ['bandung', 'Kota'], ['pontianak', 'Kota'], ['makassar', 'Kota'], ['surabaya', 'Kota'], ['yogyakarta', 'Kota'], ['semarang', 'Kota'], ['palembang', 'Kota'], ['denpasar', 'Kota'],
  ['jepang', 'Negara'], ['brasil', 'Negara'], ['mesir', 'Negara'], ['kanada', 'Negara'], ['norwegia', 'Negara'], ['italia', 'Negara'], ['spanyol', 'Negara'], ['belanda', 'Negara'], ['thailand', 'Negara'],
  ['kursi', 'Benda'], ['lemari', 'Benda'], ['jendela', 'Benda'], ['payung', 'Benda'], ['sepatu', 'Benda'], ['kacamata', 'Benda'], ['televisi', 'Benda'], ['sendok', 'Benda'], ['piring', 'Benda'],
  ['dokter', 'Profesi'], ['petani', 'Profesi'], ['nelayan', 'Profesi'], ['polisi', 'Profesi'], ['arsitek', 'Profesi'], ['pilot', 'Profesi'], ['guru', 'Profesi'],
  ['gunung', 'Alam'], ['sungai', 'Alam'], ['danau', 'Alam'], ['pantai', 'Alam'], ['pelangi', 'Alam'], ['khatulistiwa', 'Alam'],
  ['rendang', 'Makanan'], ['bakso', 'Makanan'], ['gudeg', 'Makanan'], ['pempek', 'Makanan'], ['rawon', 'Makanan'], ['tempe', 'Makanan'], ['gado-gado'.replace('-', ''), 'Makanan'],
];
export const SENTENCES: string[] = [
  'Pontianak dilalui oleh garis khatulistiwa', 'Bersatu kita teguh bercerai kita runtuh', 'Berakit rakit ke hulu berenang renang ke tepian', 'Sedikit demi sedikit lama lama menjadi bukit',
  'Rajin pangkal pandai hemat pangkal kaya', 'Air susu dibalas dengan air tuba', 'Tak ada gading yang tak retak', 'Di mana bumi dipijak di situ langit dijunjung',
  'Bhinneka Tunggal Ika berbeda beda tetapi tetap satu', 'Proklamasi kemerdekaan dibacakan pada tujuh belas Agustus', 'Borobudur adalah candi Buddha terbesar di dunia',
  'Komodo adalah kadal terbesar yang hidup di Indonesia', 'Matahari terbit dari timur dan terbenam di barat', 'Belajar sambil bermain membuat ilmu mudah diingat',
  'Kapal layar melintasi samudra membawa rempah rempah', 'Hujan turun deras membasahi kebun di tepi sungai', 'Anak anak bermain layang layang di lapangan',
  'Ibu kota negara berpindah mengikuti sejarah bangsa', 'Gunung berapi menyimpan kekuatan alam yang luar biasa', 'Kita bermain bersama agar semakin dekat dan saling mengenal',
];
