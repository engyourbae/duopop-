/* DUOPOP — Paket Upgrade 1: dataset (menghasilkan ribuan soal unik), pernyataan mitos baru, dan varian topik.
   Cara pakai: tambahkan <script src="./packs/upgrade-1.js"></script> di index.html SEBELUM skrip utama. Tidak perlu build ulang kode. */
(function () {
  var rows = function (keys, data) { return data.map(function (r) { var o = {}; keys.forEach(function (k, i) { o[k] = r[i]; }); return o; }); };

  var negara = rows(['name', 'capital', 'continent', 'currency', 'language', 'area', 'pop'], [
    ['Indonesia', 'Jakarta', 'Asia', 'Rupiah', 'Indonesia', 1905, 280], ['Malaysia', 'Kuala Lumpur', 'Asia', 'Ringgit', 'Melayu', 331, 34], ['Singapura', 'Singapura', 'Asia', 'Dolar Singapura', 'Inggris', 0.7, 6],
    ['Thailand', 'Bangkok', 'Asia', 'Baht', 'Thai', 513, 71], ['Vietnam', 'Hanoi', 'Asia', 'Dong', 'Vietnam', 331, 100], ['Filipina', 'Manila', 'Asia', 'Peso Filipina', 'Filipino', 300, 117],
    ['Jepang', 'Tokyo', 'Asia', 'Yen', 'Jepang', 378, 124], ['Korea Selatan', 'Seoul', 'Asia', 'Won', 'Korea', 100, 52], ['Tiongkok', 'Beijing', 'Asia', 'Yuan', 'Mandarin', 9597, 1410],
    ['India', 'New Delhi', 'Asia', 'Rupee India', 'Hindi', 3287, 1430], ['Pakistan', 'Islamabad', 'Asia', 'Rupee Pakistan', 'Urdu', 882, 240], ['Bangladesh', 'Dhaka', 'Asia', 'Taka', 'Bengali', 148, 173],
    ['Arab Saudi', 'Riyadh', 'Asia', 'Riyal', 'Arab', 2150, 36], ['Turki', 'Ankara', 'Asia', 'Lira', 'Turki', 784, 85], ['Iran', 'Teheran', 'Asia', 'Rial', 'Persia', 1648, 89],
    ['Kamboja', 'Phnom Penh', 'Asia', 'Riel', 'Khmer', 181, 17], ['Laos', 'Vientiane', 'Asia', 'Kip', 'Lao', 237, 8], ['Myanmar', 'Naypyidaw', 'Asia', 'Kyat', 'Burma', 677, 54],
    ['Nepal', 'Kathmandu', 'Asia', 'Rupee Nepal', 'Nepal', 147, 30], ['Mongolia', 'Ulaanbaatar', 'Asia', 'Tugrik', 'Mongol', 1564, 3], ['Brunei', 'Bandar Seri Begawan', 'Asia', 'Dolar Brunei', 'Melayu', 6, 0.5],
    ['Timor Leste', 'Dili', 'Asia', 'Dolar AS', 'Tetun', 15, 1.4], ['Sri Lanka', 'Sri Jayawardenepura Kotte', 'Asia', 'Rupee Sri Lanka', 'Sinhala', 66, 22],
    ['Australia', 'Canberra', 'Oseania', 'Dolar Australia', 'Inggris', 7692, 26], ['Selandia Baru', 'Wellington', 'Oseania', 'Dolar Selandia Baru', 'Inggris', 268, 5],
    ['Inggris', 'London', 'Eropa', 'Poundsterling', 'Inggris', 244, 68], ['Prancis', 'Paris', 'Eropa', 'Euro', 'Prancis', 644, 68], ['Jerman', 'Berlin', 'Eropa', 'Euro', 'Jerman', 358, 84],
    ['Italia', 'Roma', 'Eropa', 'Euro', 'Italia', 301, 59], ['Spanyol', 'Madrid', 'Eropa', 'Euro', 'Spanyol', 506, 48], ['Portugal', 'Lisboa', 'Eropa', 'Euro', 'Portugis', 92, 10],
    ['Belanda', 'Amsterdam', 'Eropa', 'Euro', 'Belanda', 42, 18], ['Swiss', 'Bern', 'Eropa', 'Franc Swiss', 'Jerman', 41, 9], ['Swedia', 'Stockholm', 'Eropa', 'Krona Swedia', 'Swedia', 450, 10],
    ['Norwegia', 'Oslo', 'Eropa', 'Krone Norwegia', 'Norwegia', 385, 5], ['Rusia', 'Moskow', 'Eropa', 'Rubel', 'Rusia', 17098, 144], ['Polandia', 'Warsawa', 'Eropa', 'Zloty', 'Polandia', 313, 37],
    ['Yunani', 'Athena', 'Eropa', 'Euro', 'Yunani', 132, 10], ['Ukraina', 'Kyiv', 'Eropa', 'Hryvnia', 'Ukraina', 604, 38], ['Austria', 'Wina', 'Eropa', 'Euro', 'Jerman', 84, 9],
    ['Belgia', 'Brussel', 'Eropa', 'Euro', 'Belanda', 31, 12], ['Irlandia', 'Dublin', 'Eropa', 'Euro', 'Inggris', 70, 5], ['Finlandia', 'Helsinki', 'Eropa', 'Euro', 'Finlandia', 338, 6], ['Denmark', 'Kopenhagen', 'Eropa', 'Krone Denmark', 'Denmark', 43, 6],
    ['Brasil', 'Brasília', 'Amerika Selatan', 'Real', 'Portugis', 8516, 216], ['Argentina', 'Buenos Aires', 'Amerika Selatan', 'Peso Argentina', 'Spanyol', 2780, 46], ['Chile', 'Santiago', 'Amerika Selatan', 'Peso Chile', 'Spanyol', 756, 20],
    ['Kolombia', 'Bogotá', 'Amerika Selatan', 'Peso Kolombia', 'Spanyol', 1142, 52], ['Peru', 'Lima', 'Amerika Selatan', 'Sol', 'Spanyol', 1285, 34],
    ['Meksiko', 'Meksiko City', 'Amerika Utara', 'Peso Meksiko', 'Spanyol', 1964, 129], ['Kanada', 'Ottawa', 'Amerika Utara', 'Dolar Kanada', 'Inggris', 9985, 40], ['Amerika Serikat', 'Washington D.C.', 'Amerika Utara', 'Dolar AS', 'Inggris', 9834, 335],
    ['Kuba', 'Havana', 'Amerika Utara', 'Peso Kuba', 'Spanyol', 110, 11], ['Mesir', 'Kairo', 'Afrika', 'Pound Mesir', 'Arab', 1002, 112], ['Nigeria', 'Abuja', 'Afrika', 'Naira', 'Inggris', 924, 223],
    ['Kenya', 'Nairobi', 'Afrika', 'Shilling Kenya', 'Swahili', 580, 55], ['Ethiopia', 'Addis Ababa', 'Afrika', 'Birr', 'Amharik', 1104, 126], ['Maroko', 'Rabat', 'Afrika', 'Dirham', 'Arab', 447, 37], ['Ghana', 'Accra', 'Afrika', 'Cedi', 'Inggris', 239, 34]
  ]);

  var ev = function (d) { return d.map(function (r) { return { name: r[0], year: r[1] }; }); };
  var peristiwa = ev([
    ['Proklamasi Kemerdekaan Indonesia', 1945], ['Sumpah Pemuda', 1928], ['Berdirinya Budi Utomo', 1908], ['Konferensi Asia Afrika di Bandung', 1955], ['Pemilu pertama Indonesia', 1955], ['Dekret Presiden kembali ke UUD 1945', 1959],
    ['Supersemar', 1966], ['Soeharto mengundurkan diri', 1998], ['Pemilihan presiden langsung pertama di Indonesia', 2004], ['Gempa dan tsunami Aceh', 2004], ['Letusan Gunung Krakatau', 1883], ['Letusan Gunung Tambora', 1815],
    ['Perang Diponegoro dimulai', 1825], ['Berdirinya VOC', 1602], ['Perjanjian Giyanti', 1755], ['Pertempuran Surabaya', 1945], ['Agresi Militer Belanda II', 1948], ['Penyerahan kedaulatan lewat Konferensi Meja Bundar', 1949],
    ['Berdirinya Kesultanan Pontianak', 1771], ['Indonesia menjadi anggota PBB', 1950], ['Berdirinya ASEAN', 1967], ['Referendum Timor Timur', 1999], ['Asian Games pertama di Jakarta', 1962], ['Indonesia meraih emas Olimpiade pertama', 1992],
    ['Olimpiade modern pertama di Athena', 1896], ['Columbus tiba di Amerika', 1492], ['Vasco da Gama tiba di India', 1498], ['Reformasi Protestan dimulai', 1517], ['Deklarasi Kemerdekaan Amerika Serikat', 1776], ['Revolusi Prancis', 1789],
    ['Pertempuran Waterloo', 1815], ['Perang Saudara Amerika dimulai', 1861], ['Telepon dipatenkan oleh Bell', 1876], ['Bola lampu pijar Edison', 1879], ['Penerbangan pertama Wright bersaudara', 1903], ['Tenggelamnya kapal Titanic', 1912],
    ['Perang Dunia I dimulai', 1914], ['Revolusi Rusia', 1917], ['Perang Dunia II dimulai', 1939], ['Perang Dunia II berakhir', 1945], ['Berdirinya PBB', 1945], ['Penemuan penisilin', 1928], ['Struktur DNA diusulkan', 1953],
    ['Peluncuran Sputnik 1', 1957], ['Yuri Gagarin ke luar angkasa', 1961], ['Pendaratan manusia di Bulan', 1969], ['Tembok Berlin dibangun', 1961], ['Runtuhnya Tembok Berlin', 1989], ['Bubarnya Uni Soviet', 1991],
    ['Web dibuka untuk publik', 1991], ['Euro mulai beredar', 2002], ['Serangan 11 September', 2001], ['iPhone pertama dirilis', 2007], ['WHO menyatakan pandemi COVID-19', 2020], ['Google didirikan', 1998], ['Facebook diluncurkan', 2004],
    ['YouTube didirikan', 2005], ['Magna Carta', 1215], ['Jatuhnya Konstantinopel', 1453], ['Kemerdekaan India', 1947], ['Kemerdekaan Malaysia', 1957], ['Singapura berpisah dari Malaysia', 1965], ['Nelson Mandela dibebaskan', 1990],
    ['Ledakan reaktor Chernobyl', 1986], ['Serangan Pearl Harbor', 1941], ['Peluncuran Teleskop Hubble', 1990], ['Domba Dolly dikloning', 1996], ['Proyek Genom Manusia selesai', 2003], ['Piala Dunia FIFA pertama', 1930]
  ]);

  var hewan = rows(['name', 'cls', 'food'], [
    ['Gajah', 'Mamalia', 'Herbivora'], ['Harimau', 'Mamalia', 'Karnivora'], ['Singa', 'Mamalia', 'Karnivora'], ['Zebra', 'Mamalia', 'Herbivora'], ['Jerapah', 'Mamalia', 'Herbivora'], ['Paus biru', 'Mamalia', 'Karnivora'],
    ['Lumba-lumba', 'Mamalia', 'Karnivora'], ['Kanguru', 'Mamalia', 'Herbivora'], ['Koala', 'Mamalia', 'Herbivora'], ['Beruang', 'Mamalia', 'Omnivora'], ['Orangutan', 'Mamalia', 'Omnivora'], ['Sapi', 'Mamalia', 'Herbivora'],
    ['Elang', 'Burung', 'Karnivora'], ['Merpati', 'Burung', 'Herbivora'], ['Bebek', 'Burung', 'Omnivora'], ['Ayam', 'Burung', 'Omnivora'], ['Burung hantu', 'Burung', 'Karnivora'], ['Pinguin', 'Burung', 'Karnivora'], ['Burung unta', 'Burung', 'Omnivora'],
    ['Buaya', 'Reptil', 'Karnivora'], ['Komodo', 'Reptil', 'Karnivora'], ['Kura-kura', 'Reptil', 'Omnivora'], ['Ular sanca', 'Reptil', 'Karnivora'], ['Bunglon', 'Reptil', 'Karnivora'],
    ['Katak', 'Amfibi', 'Karnivora'], ['Salamander', 'Amfibi', 'Karnivora'], ['Hiu', 'Ikan', 'Karnivora'], ['Ikan mas', 'Ikan', 'Omnivora'], ['Ikan lele', 'Ikan', 'Omnivora'], ['Pari manta', 'Ikan', 'Karnivora'], ['Kuda laut', 'Ikan', 'Karnivora'],
    ['Lebah', 'Serangga', 'Herbivora'], ['Kupu-kupu', 'Serangga', 'Herbivora'], ['Semut', 'Serangga', 'Omnivora'], ['Belalang', 'Serangga', 'Herbivora'], ['Capung', 'Serangga', 'Karnivora'], ['Kecoa', 'Serangga', 'Omnivora']
  ]);

  var unsur = rows(['name', 'symbol', 'number'], [
    ['Hidrogen', 'H', 1], ['Helium', 'He', 2], ['Litium', 'Li', 3], ['Karbon', 'C', 6], ['Nitrogen', 'N', 7], ['Oksigen', 'O', 8], ['Fluor', 'F', 9], ['Neon', 'Ne', 10], ['Natrium', 'Na', 11], ['Magnesium', 'Mg', 12],
    ['Aluminium', 'Al', 13], ['Silikon', 'Si', 14], ['Fosfor', 'P', 15], ['Belerang', 'S', 16], ['Klor', 'Cl', 17], ['Argon', 'Ar', 18], ['Kalium', 'K', 19], ['Kalsium', 'Ca', 20], ['Besi', 'Fe', 26], ['Nikel', 'Ni', 28],
    ['Tembaga', 'Cu', 29], ['Seng', 'Zn', 30], ['Brom', 'Br', 35], ['Perak', 'Ag', 47], ['Timah', 'Sn', 50], ['Iodium', 'I', 53], ['Emas', 'Au', 79], ['Raksa', 'Hg', 80], ['Timbal', 'Pb', 82], ['Uranium', 'U', 92]
  ]);

  var tokoh = rows(['name', 'field', 'born'], [
    ['Soekarno', 'Presiden pertama Indonesia', 1901], ['Mohammad Hatta', 'Wakil presiden pertama Indonesia', 1902], ['R.A. Kartini', 'Pelopor emansipasi perempuan', 1879], ['Ki Hajar Dewantara', 'Bapak pendidikan nasional', 1889],
    ['Soeharto', 'Presiden kedua Indonesia', 1921], ['B.J. Habibie', 'Presiden ketiga dan ahli pesawat terbang', 1936], ['Pramoedya Ananta Toer', 'Sastrawan', 1925], ['Chairil Anwar', 'Penyair Angkatan 45', 1922],
    ['W.R. Supratman', 'Pencipta lagu Indonesia Raya', 1903], ['Raden Saleh', 'Pelukis', 1811], ['Jenderal Soedirman', 'Panglima Besar TNI', 1916], ['Cut Nyak Dhien', 'Pahlawan perang Aceh', 1848], ['Pangeran Diponegoro', 'Pemimpin Perang Jawa', 1785],
    ['Sutan Sjahrir', 'Perdana Menteri pertama Indonesia', 1909], ['Dewi Sartika', 'Pendidik perempuan Sunda', 1884], ['Albert Einstein', 'Fisikawan teori relativitas', 1879], ['Isaac Newton', 'Fisikawan hukum gravitasi', 1643],
    ['Marie Curie', 'Peraih dua Nobel sains', 1867], ['Charles Darwin', 'Penggagas teori evolusi', 1809], ['Leonardo da Vinci', 'Pelukis Mona Lisa', 1452], ['Wolfgang Mozart', 'Komponis', 1756], ['Ludwig van Beethoven', 'Komponis simfoni', 1770],
    ['William Shakespeare', 'Penulis drama Romeo dan Juliet', 1564], ['Mahatma Gandhi', 'Pemimpin perjuangan nirkekerasan India', 1869], ['Nelson Mandela', 'Presiden kulit hitam pertama Afrika Selatan', 1918], ['Thomas Edison', 'Penemu bola lampu pijar praktis', 1847],
    ['Stephen Hawking', 'Fisikawan kosmologi', 1942], ['Pablo Picasso', 'Pelukis Guernica', 1881], ['Vincent van Gogh', 'Pelukis Malam Berbintang', 1853], ['Galileo Galilei', 'Astronom yang memakai teleskop', 1564]
  ]);

  var cmpLuas = { q: 'Manakah yang lebih luas wilayahnya?', field: 'area', max: true, unit: 'ribu km²' }, cmpPop = { q: 'Manakah yang penduduknya lebih banyak?', field: 'pop', max: true, unit: 'juta jiwa' };
  var myths = [
    ['Guntur terjadi karena awan saling bertabrakan.', 1, 'Guntur adalah bunyi akibat udara yang memuai cepat oleh panas petir.'], ['Kita kehilangan sebagian besar panas tubuh lewat kepala.', 1, 'Panas hilang sebanding dengan luas permukaan yang terbuka.'],
    ['Unta menyimpan air di punuknya.', 1, 'Punuk unta menyimpan lemak, bukan air.'], ['Warna biru laut hanya pantulan langit.', 1, 'Air menyerap cahaya merah lebih kuat sehingga tampak biru; pantulan langit hanya sebagian.'],
    ['Matahari adalah sebuah bintang.', 0, 'Matahari adalah bintang katai kuning di pusat tata surya.'], ['Manusia berevolusi dari simpanse yang hidup sekarang.', 1, 'Manusia dan simpanse berbagi nenek moyang yang sama, bukan satu berevolusi dari yang lain.'],
    ['Daun berwarna kuning di musim gugur karena klorofil menghilang dan pigmen lain tampak.', 0, 'Pigmen karotenoid sudah ada, tertutup klorofil hijau.'], ['Pisang tumbuh di pohon sejati.', 1, 'Batang pisang adalah batang semu dari pelepah daun; pisang tergolong herba raksasa.'],
    ['Kunang-kunang menghasilkan cahaya dingin lewat bioluminesensi.', 0, 'Reaksi kimia mengubah hampir seluruh energi menjadi cahaya, bukan panas.'], ['Berjalan di bawah tangga membawa sial.', 1, 'Itu takhayul tanpa dasar ilmiah.'],
    ['Telur cokelat lebih bergizi daripada telur putih.', 1, 'Warna kulit ditentukan oleh jenis ayam, bukan gizi.'], ['Permen karet yang tertelan bertahan tujuh tahun di perut.', 1, 'Permen karet keluar bersama tinja dalam beberapa hari.'],
    ['Rambut bisa beruban dalam semalam karena stres.', 1, 'Pigmen rambut yang sudah tumbuh tidak berubah dalam semalam.'], ['Gurita memiliki tiga jantung.', 0, 'Dua jantung brankial dan satu jantung sistemik.'], ['Kepiting berjalan menyamping.', 0, 'Bentuk kaki dan sendinya membuat gerak menyamping paling efisien.'],
    ['Tikus lebih menyukai keju daripada makanan lain.', 1, 'Tikus lebih menyukai makanan manis dan berkarbohidrat.'], ['Burung unta menyembunyikan kepala di dalam pasir.', 1, 'Mereka menunduk untuk makan atau memeriksa sarang di tanah.'], ['Jerapah memiliki tujuh ruas tulang leher, sama seperti manusia.', 0, 'Ruas jerapah jauh lebih panjang, tetapi jumlahnya tetap tujuh.'],
    ['Musim terjadi karena jarak Bumi ke Matahari berubah.', 1, 'Musim disebabkan kemiringan sumbu Bumi.'], ['Semua orang dewasa membutuhkan tepat delapan jam tidur.', 1, 'Kebutuhan tidur bervariasi, umumnya 7–9 jam.'], ['Bulan memiliki sisi gelap yang tidak pernah disinari Matahari.', 1, 'Sisi jauh Bulan juga mendapat sinar Matahari; hanya tidak terlihat dari Bumi.'],
    ['Kucing selalu mendarat dengan kaki.', 1, 'Kucing sering berhasil, tetapi bukan selalu, dan jatuh dari tinggi tetap berbahaya.'], ['Indonesia memiliki lebih dari 700 bahasa daerah.', 0, 'Jumlah bahasa daerah di Indonesia berkisar di atas 700.'], ['Hewan tardigrada dapat bertahan di ruang hampa dalam kondisi tertentu.', 0, 'Dalam keadaan "tun", mereka tahan kondisi ekstrem.'],
    ['Air murni adalah penghantar listrik yang baik.', 1, 'Air murni hampir tidak menghantarkan listrik; ion terlarutlah yang menghantarkan.'], ['Es batu selalu lebih cepat membeku dari air panas (efek Mpemba).', 2, 'Efek ini diperdebatkan dan tidak terbukti konsisten.'],
    ['Mendengarkan musik saat belajar selalu meningkatkan nilai.', 2, 'Hasil penelitian beragam; bergantung jenis musik dan tugas.'], ['Minum kopi menghambat pertumbuhan tinggi badan.', 1, 'Tidak ada bukti bahwa kopi menghambat tinggi badan.']
  ].map(function (m) { return { s: m[0], a: m[1], e: m[2] }; });

  (window.DUOPOP_PACKS = window.DUOPOP_PACKS || []).push({
    id: 'upgrade-1', name: 'Upgrade 1', version: 1,
    categoryLabels: { negara: 'Negara & Ibu Kota', peristiwa: 'Peristiwa & Tahun', 'hewan-ds': 'Dunia Hewan', 'unsur-ds': 'Unsur Kimia', 'tokoh-ds': 'Tokoh Dunia & Indonesia' },
    variants: [
      { id: 'negara', label: 'Negara, Mata Uang & Perbandingan', categories: ['negara'] }, { id: 'peristiwa', label: 'Peristiwa & Tahun', categories: ['peristiwa'] }, { id: 'hewan-ds', label: 'Dunia Hewan', categories: ['hewan-ds'] },
      { id: 'unsur-ds', label: 'Unsur Kimia & Nomor Atom', categories: ['unsur-ds'] }, { id: 'tokoh-ds', label: 'Tokoh Dunia & Indonesia', categories: ['tokoh-ds'] }
    ],
    myths: myths,
    datasets: [
      { id: 'negara', category: 'negara', sub: 'Negara', rows: negara, compares: [cmpLuas, cmpPop], templates: [
        { q: 'Ibu kota {name} adalah…', a: '{capital}', d: 'mudah' }, { q: '{capital} adalah ibu kota negara…', a: '{name}', d: 'mudah' }, { q: '{name} terletak di benua…', a: '{continent}', d: 'mudah' },
        { q: 'Mata uang resmi {name} adalah…', a: '{currency}', d: 'sedang' }, { q: 'Bahasa utama di {name} adalah…', a: '{language}', d: 'sedang' } ] },
      { id: 'peristiwa', category: 'peristiwa', sub: 'Tahun', rows: peristiwa, compares: [{ q: 'Manakah peristiwa yang terjadi lebih dulu?', field: 'year', max: false }, { q: 'Manakah peristiwa yang terjadi lebih akhir?', field: 'year', max: true }],
        templates: [{ q: '“{name}” terjadi pada tahun…', a: '{year}', d: 'sulit', e: '{name} terjadi pada tahun {year}.' }] },
      { id: 'hewan', category: 'hewan-ds', sub: 'Hewan', rows: hewan, templates: [
        { q: '{name} termasuk golongan hewan…', a: '{cls}', d: 'mudah' }, { q: '{name} tergolong hewan pemakan…', a: '{food}', d: 'sedang' } ] },
      { id: 'unsur', category: 'unsur-ds', sub: 'Unsur', rows: unsur, compares: [{ q: 'Manakah yang nomor atomnya lebih besar?', field: 'number', max: true }], templates: [
        { q: 'Nomor atom {name} adalah…', a: '{number}', d: 'sulit' }, { q: 'Unsur dengan nomor atom {number} adalah…', a: '{name}', d: 'sulit' }, { q: 'Lambang kimia {name} adalah…', a: '{symbol}', d: 'sedang' } ] },
      { id: 'tokoh', category: 'tokoh-ds', sub: 'Tokoh', rows: tokoh, compares: [{ q: 'Siapa yang lahir lebih dulu?', field: 'born', max: false }], templates: [
        { q: '{name} dikenal sebagai…', a: '{field}', d: 'sedang' }, { q: 'Tokoh yang dikenal sebagai “{field}” adalah…', a: '{name}', d: 'sedang' } ] }
    ]
  });
})();
