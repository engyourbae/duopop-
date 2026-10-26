export const thisOrThat: [string, string][] = [
  ['Pantai', 'Gunung'], ['Kopi', 'Teh'], ['Pagi hari', 'Malam hari'], ['Film di rumah', 'Bioskop'], ['Masak sendiri', 'Jajan di luar'],
  ['Kucing', 'Anjing'], ['Hujan', 'Cerah'], ['Liburan spontan', 'Liburan terencana'], ['Pesan teks', 'Telepon'], ['Nasi', 'Mi'],
  ['Pedas', 'Manis'], ['Baca buku', 'Nonton film'], ['Tidur cepat', 'Begadang'], ['Kota besar', 'Desa tenang'], ['Hadiah mahal', 'Hadiah bermakna'],
  ['Kejutan', 'Rencana matang'], ['Berkemah', 'Menginap di hotel'], ['Musik', 'Podcast'], ['Foto', 'Video'], ['Es krim', 'Cokelat'],
  ['Nonton bareng', 'Main game bareng'], ['Matahari terbit', 'Matahari terbenam'], ['Ngobrol panjang', 'Diam yang nyaman'], ['Bakso', 'Soto'],
  ['Roti', 'Bubur'], ['Cuaca dingin', 'Cuaca hangat'], ['Jalan kaki santai', 'Naik motor keliling'], ['Mengenang masa lalu', 'Merancang masa depan'],
  ['Tinggal di luar negeri', 'Tinggal dekat keluarga'], ['Mandi pagi', 'Mandi malam'],
];
export const wouldYouRather: [string, string][] = [
  ['Bisa terbang', 'Bisa menghilang'], ['Tidak pernah lelah', 'Tidak pernah lapar'], ['Bisa membaca pikiran', 'Bisa melihat masa depan'],
  ['Hidup tanpa musik', 'Hidup tanpa film'], ['Liburan keliling dunia setahun', 'Punya rumah impian'], ['Selalu terlambat 10 menit', 'Selalu datang 1 jam lebih awal'],
  ['Makan makanan pedas setiap hari', 'Makan makanan manis setiap hari'], ['Kehilangan ponsel seminggu', 'Kehilangan dompet sehari'],
  ['Bisa bicara semua bahasa', 'Bisa bicara dengan hewan'], ['Kembali ke masa lalu', 'Loncat ke masa depan'], ['Terkenal tapi sibuk', 'Biasa saja tapi santai'],
  ['Tinggal di pulau terpencil', 'Tinggal di kota super ramai'], ['Tidak pernah hujan', 'Tidak pernah panas terik'], ['Selalu jujur', 'Selalu bisa membuat orang tertawa'],
  ['Kaya mendadak', 'Pintar mendadak'], ['Punya satu teman sangat dekat', 'Punya banyak kenalan seru'], ['Tidur 12 jam setiap hari', 'Tidur 4 jam tetapi segar'],
  ['Mengulang hari paling bahagia', 'Mengalami hari baru yang tak terduga'], ['Dikejar zombie', 'Dikejar monster raksasa lucu'], ['Naik gunung sunyi', 'Konser meriah di pantai'],
];
/** Bank "Seberapa Kenal Kamu" — pemain menjawab tentang dirinya, pasangan menebak. */
export const knowMe: { q: string; o: string[] }[] = [
  { q: 'Akhir pekan idealku adalah…', o: ['Rebahan di rumah', 'Jalan-jalan keluar kota', 'Kumpul bareng teman', 'Kulineran'] },
  { q: 'Makanan yang paling bikin aku senang…', o: ['Nasi dan lauk rumahan', 'Mi atau pasta', 'Camilan dan jajanan', 'Makanan manis penutup'] },
  { q: 'Saat sedih, aku biasanya…', o: ['Menyendiri', 'Curhat ke seseorang', 'Makan enak', 'Tidur atau nonton'] },
  { q: 'Aku paling merasa dicintai ketika…', o: ['Dipuji tulus', 'Ditemani lama', 'Diberi kejutan kecil', 'Dibantu tanpa diminta'] },
  { q: 'Hal yang paling membuatku kesal…', o: ['Terlambat', 'Berantakan', 'Diabaikan', 'Berisik'] },
  { q: 'Tempat liburan impianku…', o: ['Pantai', 'Gunung', 'Kota bersejarah', 'Luar negeri'] },
  { q: 'Genre film favoritku…', o: ['Romantis', 'Komedi', 'Aksi/petualangan', 'Horor/misteri'] },
  { q: 'Aku paling cepat tidur saat…', o: ['Kamar dingin dan gelap', 'Ditemani musik', 'Habis capek beraktivitas', 'Sambil nonton sesuatu'] },
  { q: 'Cara aku memecahkan masalah…', o: ['Dipikir sendiri dulu', 'Langsung diskusi', 'Cari info di internet', 'Menunggu dan melihat'] },
  { q: 'Hadiah yang paling kusuka…', o: ['Barang buatan tangan', 'Pengalaman bersama', 'Barang yang kubutuhkan', 'Surat atau kata-kata'] },
  { q: 'Aku merasa paling produktif…', o: ['Pagi hari', 'Siang hari', 'Sore hari', 'Malam hari'] },
  { q: 'Minuman andalanku…', o: ['Kopi', 'Teh', 'Air putih', 'Minuman manis dingin'] },
  { q: 'Kalau ada waktu kosong sejam, aku akan…', o: ['Main gawai', 'Membaca', 'Olahraga ringan', 'Tidur siang'] },
  { q: 'Hal yang paling membuatku bangga…', o: ['Pencapaian pribadi', 'Keluarga', 'Persahabatan', 'Karya yang kubuat'] },
  { q: 'Bagian paling aku nantikan dalam hubungan…', o: ['Percakapan malam', 'Perjalanan bersama', 'Rutinitas kecil', 'Tujuan masa depan'] },
];
/** Bank "Cocokkan Jawabanku" — dua pemain menjawab diam-diam; poin jika sama. */
export const matchBank: { q: string; o: string[] }[] = [
  { q: 'Kencan pertama yang ideal adalah…', o: ['Makan malam', 'Nonton film', 'Jalan di taman', 'Ngopi santai'] },
  { q: 'Hewan peliharaan terbaik…', o: ['Kucing', 'Anjing', 'Ikan', 'Burung'] },
  { q: 'Liburan terbaik bersama pasangan…', o: ['Pantai', 'Gunung', 'Kota', 'Rumah saja'] },
  { q: 'Hari spesial paling ingin dirayakan…', o: ['Ulang tahun', 'Hari jadian', 'Tahun baru', 'Lebaran'] },
  { q: 'Hal paling romantis menurutku…', o: ['Kata-kata manis', 'Hadiah kecil', 'Waktu berdua', 'Bantuan nyata'] },
  { q: 'Camilan wajib saat nonton…', o: ['Popcorn', 'Keripik', 'Cokelat', 'Gorengan'] },
  { q: 'Alat transportasi favorit…', o: ['Motor', 'Mobil', 'Kereta', 'Pesawat'] },
  { q: 'Musim favorit (rasa)…', o: ['Panas cerah', 'Hujan syahdu', 'Sejuk berangin', 'Tidak ada'] },
  { q: 'Cara terbaik menutup hari…', o: ['Ngobrol', 'Tidur cepat', 'Nonton', 'Main gim'] },
  { q: 'Kalau menang undian, pertama kali…', o: ['Ditabung', 'Liburan', 'Traktir keluarga', 'Beli barang impian'] },
];
export const likelyBank: string[] = [
  'lupa membawa kunci atau dompet', 'menangis saat menonton film', 'bangun paling siang', 'menang lomba makan', 'terlambat ke acara',
  'jadi terkenal di media sosial', 'membeli barang yang tidak perlu', 'tersesat padahal ada peta', 'memasak untuk semua orang', 'tertidur di bioskop',
  'paling cepat akrab dengan orang baru', 'menyimpan rahasia sampai akhir', 'memulai bisnis sendiri', 'berkata “aku ngantuk” padahal masih semangat',
  'paling sabar menghadapi macet', 'mengirim pesan panjang tengah malam', 'lupa tanggal penting', 'mengajak liburan dadakan', 'paling jago menawar harga',
  'paling sering ganti rencana', 'jadi pemimpin kelompok', 'ketakutan dengan serangga kecil', 'menolong orang asing', 'menghabiskan makanan orang lain',
];
export const memoryLane: string[] = [
  'Apa kenangan pertama kita yang paling kamu ingat?', 'Kapan terakhir kali kita tertawa sampai sakit perut?', 'Apa tempat paling berkesan yang pernah kita kunjungi bersama?',
  'Apa kesan pertamamu tentang aku?', 'Momen apa yang membuatmu sadar kita semakin dekat?', 'Lagu apa yang mengingatkanmu pada kita?',
  'Apa makanan yang paling sering kita nikmati bersama?', 'Apa hal sederhana dari kita yang tidak ingin kamu lupakan?', 'Pernahkah kita nyasar bersama? Ceritakan.',
  'Hal paling lucu yang pernah kita lakukan?', 'Apa foto favoritmu tentang kita?', 'Saat paling sulit apa yang berhasil kita lewati bersama?',
  'Hadiah atau kejutan apa yang paling kamu kenang?', 'Kebiasaan kecilku apa yang diam-diam kamu suka?', 'Apa mimpi bersama yang ingin kita capai tahun depan?', 'Kalimat apa dariku yang paling membekas?',
];
export const deepTalk: { level: 1 | 2 | 3; q: string }[] = [
  { level: 1, q: 'Apa hal kecil yang membuatmu bahagia hari ini?' }, { level: 1, q: 'Apa hobi yang ingin kamu coba bersamaku?' },
  { level: 1, q: 'Apa kebiasaan pagimu yang paling tidak bisa ditinggalkan?' }, { level: 1, q: 'Apa lagu yang sedang sering kamu putar?' },
  { level: 1, q: 'Tempat mana yang membuatmu merasa tenang?' }, { level: 1, q: 'Apa hal paling konyol yang pernah kamu takuti?' }, { level: 1, q: 'Siapa tokoh yang kamu kagumi dan kenapa?' },
  { level: 2, q: 'Apa yang paling kamu butuhkan dariku saat sedang lelah?' }, { level: 2, q: 'Apa nilai hidup yang tidak bisa kamu tawar?' },
  { level: 2, q: 'Apa kekhawatiran yang jarang kamu ceritakan?' }, { level: 2, q: 'Kapan kamu merasa paling dimengerti?' },
  { level: 2, q: 'Apa yang kamu pelajari dari kegagalan terbesarmu?' }, { level: 2, q: 'Bagaimana kamu ingin kita menyelesaikan perbedaan pendapat?' }, { level: 2, q: 'Apa batasan yang ingin kamu jaga dalam hubungan?' },
  { level: 3, q: 'Seperti apa kehidupan yang kamu anggap berhasil lima tahun lagi?' }, { level: 3, q: 'Apa luka lama yang masih memengaruhi caramu mencintai?' },
  { level: 3, q: 'Apa yang ingin kamu ubah dari dirimu, dan bagaimana aku bisa mendukung?' }, { level: 3, q: 'Apa ketakutan terbesarmu soal masa depan kita?' },
  { level: 3, q: 'Peran apa yang ingin kamu mainkan dalam hidupku?' }, { level: 3, q: 'Apa yang ingin kamu dengar lebih sering dariku?' }, { level: 3, q: 'Apa warisan yang ingin kamu tinggalkan?' },
];
export const loveLangs = { kata: 'Kata-kata Penguatan', waktu: 'Waktu Berkualitas', hadiah: 'Menerima Hadiah', bantuan: 'Tindakan Pelayanan', sentuhan: 'Sentuhan Fisik' } as const;
export type LoveKey = keyof typeof loveLangs;
export const loveQuiz: { a: [string, LoveKey]; b: [string, LoveKey] }[] = [
  { a: ['Aku senang dipuji dengan tulus.', 'kata'], b: ['Aku senang ditemani tanpa gangguan gawai.', 'waktu'] },
  { a: ['Hadiah kecil yang dipilih dengan perhatian membuatku terharu.', 'hadiah'], b: ['Dibantu mengerjakan tugasku membuatku merasa disayang.', 'bantuan'] },
  { a: ['Pelukan hangat bisa menenangkanku.', 'sentuhan'], b: ['Ucapan “aku bangga padamu” sangat berarti.', 'kata'] },
  { a: ['Aku suka menghabiskan waktu berdua tanpa rencana.', 'waktu'], b: ['Aku suka menerima kejutan kecil.', 'hadiah'] },
  { a: ['Pasangan mengerjakan tugas rumah tanpa diminta itu romantis.', 'bantuan'], b: ['Menggenggam tangan saat berjalan itu romantis.', 'sentuhan'] },
  { a: ['Pesan manis di pagi hari membuat hariku.', 'kata'], b: ['Dibantu saat aku kewalahan membuat hariku.', 'bantuan'] },
  { a: ['Mengobrol panjang sebelum tidur sangat berharga.', 'waktu'], b: ['Berpelukan sebelum tidur sangat berharga.', 'sentuhan'] },
  { a: ['Aku menyimpan benda kenangan dari orang tersayang.', 'hadiah'], b: ['Aku mengingat kata-kata baik yang pernah diucapkan.', 'kata'] },
  { a: ['Perjalanan berdua lebih berkesan dibanding barang.', 'waktu'], b: ['Barang pilihan yang tepat sangat berkesan.', 'hadiah'] },
  { a: ['Sentuhan di bahu saat aku sedih membantu.', 'sentuhan'], b: ['Ada yang mengurus sesuatu untukku saat sedih membantu.', 'bantuan'] },
];

/** Chemistry Meter — pernyataan; jawaban sama = poin kecocokan. */
export const chemistryBank: { q: string; o: string[] }[] = [
  'Aku lebih suka rencana matang daripada spontan.', 'Aku nyaman bercerita soal perasaan sejak awal kenal.', 'Akhir pekan paling baik dihabiskan berdua saja.',
  'Aku mudah memaafkan setelah bertengkar.', 'Aku suka dikejutkan hal kecil.', 'Aku lebih suka diskusi langsung daripada memberi kode.',
  'Uang sebaiknya ditabung dulu sebelum dipakai bersenang-senang.', 'Aku butuh waktu sendiri secara rutin.', 'Aku suka mencoba makanan baru.',
  'Pertemanan pasangan sebaiknya kenal baik satu sama lain.', 'Aku lebih suka liburan petualangan daripada santai.', 'Aku cepat bangun dan semangat di pagi hari.',
  'Aku suka berbagi kabar kecil sepanjang hari.', 'Hadiah bermakna lebih penting daripada hadiah mahal.', 'Aku nyaman berbeda pendapat dengan orang terdekat.',
  'Aku suka merencanakan masa depan jauh ke depan.', 'Aku lebih suka rumah rapi setiap saat.', 'Aku suka melakukan hobi bersama pasangan.',
  'Aku mudah merasa canggung pada orang baru.', 'Aku lebih suka mendengar daripada banyak bicara.',
].map((q) => ({ q, o: ['Sangat setuju', 'Setuju', 'Kurang setuju', 'Tidak setuju'] }));
/** Jujur atau Tantangan — kartu bertanda. */
export const truthDare: string[] = [
  'Jujur: Apa hal kecil dariku yang diam-diam kamu sukai?', 'Jujur: Kapan kamu pertama kali merasa nyaman denganku?', 'Jujur: Apa kebiasaan burukmu yang belum kamu akui?',
  'Jujur: Apa momen paling memalukan yang pernah kamu alami?', 'Jujur: Hal apa yang membuatmu iri pada orang lain?', 'Jujur: Apa mimpimu yang belum pernah kamu ceritakan?',
  'Jujur: Siapa orang yang paling kamu kagumi dan kenapa?', 'Jujur: Apa ketakutan terbesarmu saat ini?', 'Jujur: Barang apa yang ingin kamu beli tapi malu mengakuinya?',
  'Jujur: Apa kebohongan kecil terakhir yang kamu ucapkan?', 'Jujur: Apa yang ingin kamu ubah dari hari ini?', 'Jujur: Lagu apa yang diam-diam kamu suka tapi malu mengakui?',
  'Jujur: Apa hal paling spontan yang pernah kamu lakukan?', 'Jujur: Apa yang paling kamu syukuri minggu ini?', 'Jujur: Ceritakan satu kenangan masa kecil yang masih kamu ingat jelas.',
  'Tantangan: Puji pemain di sebelahmu dengan tiga kalimat tulus.', 'Tantangan: Tirukan suara hewan pilihan temanmu selama 10 detik.', 'Tantangan: Nyanyikan satu bait lagu pilihan kelompok.',
  'Tantangan: Ceritakan kisah lucu dalam 30 detik tanpa jeda.', 'Tantangan: Joget bebas selama 15 detik.', 'Tantangan: Bicara dengan logat daerah lain selama satu menit.',
  'Tantangan: Buat slogan iklan untuk benda di dekatmu.', 'Tantangan: Tebak apa makanan favorit pemain lain.', 'Tantangan: Berikan satu pelukan atau tos hangat kepada pemain pilihanmu.',
  'Tantangan: Tulis satu pesan manis untuk seseorang yang kamu sayangi sekarang.', 'Tantangan: Pasang ekspresi paling aneh selama 10 detik.',
];
