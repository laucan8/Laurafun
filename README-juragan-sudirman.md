# Juragan Sudirman — Catatan Arsitektur

Game **tycoon + RPG santai 3D** di koridor Thamrin–Sudirman, Jakarta. Pemain mulai sebagai perantau dengan gerobak kopi di Taman Dukuh Atas, berkantor di **Sudirman Park** sebagai homebase, lalu membangun usaha sampai punya menara sendiri. Kota memakai landmark nyata (Bundaran HI, Monas, Wisma BNI 46, Menara Astra, GBK, Agora Mall/Thamrin Nine, Kanal Banjir Barat) dengan busway, MRT layang/bawah tanah, dan KRL yang bisa dinaiki. Seluruh teks UI dalam bahasa Indonesia.

## Cara Menjalankan

Buka `juragan-sudirman.html` di browser modern ber-WebGL (laptop, tablet, atau HP; tegak maupun mendatar). File **mandiri (~1 MB)**: three.js r170 sudah ter-bundle di dalam file — **tanpa build step dan tanpa aset eksternal**. Hanya font (Grandstander, Nunito) yang diambil dari Google Fonts; tanpa internet game tetap jalan dengan font cadangan. Di hub `index.html` game diputar dalam mode pemutar **cinema**.

## Isi Permainan

| Bagian | Isi |
|---|---|
| **Bisnis** | 18 usaha berjenjang dari Gerobak Kopi Keliling, Warteg Bahari, Kafe Kopi Susu Thamrin, Coworking Space di Menara Astra, Lantai Kantor Wisma BNI 46, Startup Fintech, Energi Hijau (panas bumi & surya) sampai **Menara Juragan**; upgrade, milestone ×2/×3/×5, manajer otomatis, jam ramai (pagi/siang/malam) |
| **Kota & Transportasi** | Jalan kaki, ojol, TransJakarta (11 halte), MRT Ratangga, KRL (termasuk kereta bandara), helikopter antar-helipad setelah dibeli; jam game berjalan (1 hari = 12 menit nyata), hujan, siang–malam, lalu lintas hidup |
| **Misi** | 43 misi berbab dari 13 NPC (petugas MRT, pedagang, bankir, pelatih padel, dll.) + 8 misi harian; 16 pencapaian, 10 gelar dari *Perantau Baru* sampai *Legenda Jakarta* |
| **Keuangan** | Kredit usaha (KUR, Modal Kerja, Investasi) dengan cicilan harian, 6 saham fiktif, barang & skill yang memberi bonus |
| **Properti** | 8 kompleks: Sudirman Park, The Pavilion, Sahid Sudirman Residence, Casa Grande, Anandamaya, Shangri-La Residences, **Two Sudirman** (beli inden, serah terima di hari ke-26), Rumah Menteng; tipe studio s.d. penthouse; **KPR** (DP 20%, tenor 10/20/30 hari game, DSR ≤ 50%); rumah memberi bonus prestise & tempat tidur (tidur → buff pagi) |
| **Olahraga** | **Padel** & **golf simulator** di Agora Mall, **tenis** di Shangri-La (day pass) dan Anandamaya (khusus penghuni/undangan). Padel/tenis: fisika bola, ketuk tepat waktu, tie-break; golf: 3 hole (bunker, kanal, island green), 6 stik, meter 3 ketukan, kamera mengikuti bola. Menang → buff Segar/Fokus/Bugar |
| **Karakter & Lemari** | Pilih Mas / Mbak / Mbak berhijab di layar judul; 6 warna kulit, 11 gaya rambut, atasan, bawahan, sepatu, topi, kacamata, tas, aksesori — sebagian dibeli, sebagian hadiah misi |

## Kontrol

- **Desktop:** `WASD`/panah gerak · klik tanah untuk berjalan ke sana · `Spasi` aksi kontekstual (bicara, masuk rumah, padel & golf, naik transportasi) · `Q`/`E` atau seret klik-kanan/`Shift` untuk memutar kamera · seret untuk menggeser peta · roda mouse zoom · `Esc` tutup panel.
- **Sentuh:** ketuk tanah untuk berjalan, ketuk NPC untuk bicara, ketuk usaha untuk menagih kas / membuka panelnya, ketuk penanda halte/stasiun untuk naik, seret satu jari menggeser peta, cubit dua jari zoom & putar; tombol aksi kontekstual dan panel bawah (sheet) untuk Bisnis, Misi, Properti, Keuangan, Lemari.
- **Olahraga:** padel/tenis `A`/`D` (atau ketuk sisi layar) arah pukulan, `Spasi` pukul; golf `A`/`D` arah, `W`/`S` ganti stik, `Spasi` 3 ketukan (mulai → kekuatan → akurasi); `Esc` keluar.

## Simpan

- **Simpan otomatis** ke `localStorage` (kunci `juragan-sudirman-save-v1`, ±4 KB).
- **Kode Simpan** (Pengaturan) untuk memindahkan progres ke perangkat lain.
- Sinkron akun hanya aktif bila game dibuka sebagai artifact Claude (kapabilitas `db`); versi hub ini murni lokal.

## Teknis

- Sumber berupa modul ES (`src/` ±8.400 baris: dunia, bangunan, transit, lalu lintas, `game/`, `game/sports/`, `ui/`) yang di-bundle esbuild; versi hub ini adalah build **standalone** (three.js ikut ter-bundle & diminifikasi, lisensi di akhir file).
- **Dunia:** kota low-poly instanced (gedung, pohon, kendaraan, pejalan kaki), langit & matahari mengikuti jam game, air kanal beranimasi, label jalan nyata.
- **Olahraga:** tiap mini-game memakai `THREE.Scene` terpisah; jam kota dibekukan selama bermain. Lintasan golf disimulasikan dulu (drag, lift, curve, pantulan & gulir per permukaan) lalu diputar ulang; lapangan golf dilukis di `<canvas>`.
- **Kamera:** mode ikuti/bebas, close-up karakter yang menghindari panel bawah (`setViewOffset`).
- Mendukung `prefers-reduced-motion`, safe-area iPhone, sentuh & mouse.

## Integrasi ke Hub (`index.html`)

- Entri pertama di `window.LAVA_GAMES` (id `juragan`, kategori **Simulasi**), sehingga menjadi sorotan besar dan target tombol "Main Sekarang".
- Kartu sorotan beranda (hero) diganti ke game ini dengan tema biru-kanal & emas; gambar promo `img/juragan-sudirman.jpg` (16:9) dan `img/juragan-sudirman-thumb.jpg` (kotak, untuk kartu) dirender dari game sendiri.
- Pemutar memakai mode **cinema** (ditambahkan ke daftar `cinema`).
- Kelas pemutar baru **`.below-bar`** (khusus game ini): di layar ≤680px iframe dimulai di bawah bilah judul (66px), karena HUD game (uang, level, jam, minimap) ada di tepi atas dan sebelumnya tertutup bilah judul/tombol Tutup. Game lain tidak berubah.
- Untuk mengembalikan sorotan beranda ke LaVa Salon & Resto: kembalikan blok `<div class="hero-feature">` dan teks *eyebrow* di `index.html` ke versi commit sebelumnya — tema CSS `salonresto` tidak dihapus, jadi langsung tampil seperti semula.

## Verifikasi yang Sudah Dilakukan

- **Game** (Chromium headless/SwiftShader, 1280×800 dan 390×844): layar judul & pilih karakter, misi bab awal, tab Properti + simulasi KPR + pembelian, cicilan harian, beli inden Two Sudirman sampai serah terima, tidur di rumah, ojol pulang, padel (berpasangan dengan pelatih), tenis (pakai day pass), golf 3 hole, Lemari — tanpa error konsol.
- **Hub** (1440×900 dan iPhone 13 390×844, lewat server HTTP lokal): sorotan beranda, kartu Sorotan, modal detail, pemutar cinema → game dimuat di iframe sampai layar judul (±30 detik di SwiftShader) → masuk kota; di dalam iframe: beli & naikkan level usaha, naik MRT (Dukuh Atas → Senayan), TransJakarta (GBK → Bundaran HI), KRL (Sudirman → Manggarai), simpan otomatis (±3,9 KB). Satu-satunya host eksternal: Google Fonts. Konsol hanya berisi peringatan bawaan hub `Unrecognized feature: 'web-share'` (atribut `allow` iframe), tidak berasal dari game.
- Rasa sentuhan dan performa sebaiknya dicoba langsung di HP/tablet (SwiftShader jauh lebih lambat daripada GPU asli).
