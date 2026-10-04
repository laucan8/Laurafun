# LaVa Salon & Resto — Catatan Arsitektur

Game kartun 2D untuk anak ±8 tahun: dandan di salon, ganti baju, make up, lalu buka restoran dan memasak untuk pengunjung hewan yang selalu ceria. Karakter utama bisa dipilih dari 5 sahabat — **Laura, Gracelyn, Ailia, Nikola, Zi En** — masing-masing punya slot simpan sendiri, dan toko mereka bisa saling dilihat di **Jalan Sahabat**. Seluruh teks UI dalam bahasa Indonesia. Tanpa batas waktu, tanpa kalah, tanpa pengunjung marah.

## Cara Menjalankan

Buka `lava-salon-resto.html` di browser modern (HP, tablet, atau laptop; posisi tegak maupun mendatar). File **mandiri (~530 KB)**: semua gambar digambar dengan SVG, suara disintesis lewat WebAudio — **tanpa aset eksternal dan tanpa build step**. Hanya font (Baloo 2, Sniglet) yang diambil dari Google Fonts; tanpa internet game tetap jalan dengan font cadangan. Di hub `index.html` game diputar dalam mode pemutar **cinema**.

## Isi Permainan

| Bagian | Isi |
|---|---|
| **Salon & Dandan** | 18 gaya rambut, 19 warna rambut, ikat rambut, **Spa Rambut** (sampo → bilas → pengering → sisir → semprot kilau, digosok pakai jari), **Salon Kuku** (12 warna + 6 motif) |
| **Make Up & Wajah** | 10 lipstik, 10 eyeshadow, 7 blush, 4 bulu mata, 12 stiker wajah, 8 warna kulit, 9 warna mata, ekspresi & pose |
| **Baju & Aksesoris** | 14 atasan, 12 bawahan, 12 gaun, 10 sepatu, 5 kaus kaki — setiap baju bisa diberi 21 warna × 8 motif; 20 aksesoris kepala, 5 kacamata, 5 kalung/dasi/syal, sayap & ransel, 8 barang di tangan (tongkat ajaib, balon, kamera, mikrofon, …); tombol **Acak!** |
| **Restoran** | 3 meja, pengunjung hewan (10 spesies, nama & baju acak) memesan lewat gelembung; sahabat yang kartunya sudah terpasang bisa datang sebagai **tamu istimewa** |
| **Dapur** | **20 menu** dalam 4 kategori — Kue & Roti (cupcake, kue tart, donat, pancake, martabak manis, kue kering), Minuman (boba, jus, milkshake, es teh & limun, cokelat panas), Makanan (pizza, burger, nasi goreng, mi & spageti, sate ayam, roti bakar), Es & Puding (es krim, es serut, puding). Tiap menu 4–7 langkah: pilih bahan lalu mini-game sentuh (aduk melingkar, tuang sampai garis hijau, blender, kocok, balik pancake, kipas sate, serut es, panggang & intip oven, tabur keju) |
| **Foto Studio** | 8 latar (termasuk Monas Jakarta), pose, bingkai, stiker; foto masuk album |
| **Hewan** | 8 hewan peliharaan untuk diadopsi, diberi nama, aksesoris, dan ikut tampil di toko |
| **Dekor Toko** | nama toko (8 pilihan + ketik sendiri), 10 warna & 7 motif dinding, 7 lantai, kanopi, meja, lampu, hiasan |
| **Album Stiker & Hadiah** | 24 stiker pencapaian, hadiah harian (ketuk kado 3×), level 1–30 yang membuka menu & barang baru |

Pengunjung selalu sabar dan positif; pesanan yang kurang pas tetap dapat 3–4 bintang, pesanan sempurna dapat 5 bintang. Satu "hari" = 6 pengunjung, lalu ada ringkasan koin, bintang, dan menu favorit.

## Simpan & Main Bareng Sahabat

- **Simpan otomatis** ke `localStorage` (kunci `lava-salon-resto:v1`), 5 slot tetap — satu per sahabat. Indikator "Tersimpan" muncul setiap kali tersimpan; anak tidak perlu menekan apa pun.
- **Kode Simpan** (Pengaturan): satu kode teks berisi seluruh progres untuk dipindah ke HP/tablet lain.
- **Kirim Tokoku** (Jalan Sahabat): membuat link `lava-salon-resto.html#toko.<kode>` → tombol WhatsApp / Bagikan / Salin. Sahabat cukup mengetuk link itu; tokonya langsung terpasang di Jalan Sahabat mereka (atau tempel kodenya di **Masukkan Kode**). Aturan gabung: **kartu yang lebih baru menang**, jadi kirim ulang kapan saja untuk memperbarui baju & progres.
- **Satu tablet bersama**: kelima slot bisa dimainkan bergantian dari layar depan, dan kelima toko langsung tampil berdampingan.
- Kode memakai format biner ringkas + checksum (±130–250 karakter untuk satu toko), aman ditempel di chat.

**Batasan yang disengaja:** tidak ada server, jadi progres sahabat terlihat setelah mereka mengirim link/kode baru (bukan live). Kalau nanti ingin sinkron otomatis, cukup tambahkan backend kecil (mis. Firebase) yang menyimpan kode toko per anak — format kodenya sudah siap.

## Teknis

- Sumber berupa modul JS biasa (`src/js/00-util.js` … `99-main.js`, ±6.900 baris) + `style.css`, digabung skrip build kecil menjadi satu file HTML.
- **Karakter**: SVG berlapis (rambut belakang/depan, siluet garis tepi, mata mengilap, lengan 2 segmen dengan pose CSS). Animasi napas memakai `transform` pada elemen `<svg>` (dikomposit GPU); kedipan dipicu JS sesekali — tidak ada animasi SVG terus-menerus, demi 60 fps di tablet.
- **Transisi layar**: lingkaran "wipe" Web Animations API dari titik yang diketuk, kartu/tombol dengan pegas CSS, partikel di `<canvas>` (konfeti, hati, bintang, remah).
- **Restoran**: panggung koordinat tetap (1280×800 mendatar / 800×1280 tegak) yang diskalakan; dinding & lantai diteruskan sampai tepi layar, gelembung pesanan otomatis diperbesar di layar kecil.
- **Suara**: efek & musik latar disintesis WebAudio; pengunjung "berbicara" lewat Web Speech bila perangkat punya suara bahasa Indonesia.
- Mendukung `prefers-reduced-motion`, safe-area iPhone, sentuh & mouse.

## Integrasi ke Hub (`index.html`)

- Entri pertama di `window.LAVA_GAMES` (id `salonresto`, kategori **Kreatif** — chip filter baru muncul otomatis), sehingga menjadi sorotan besar dan target tombol "Main Sekarang".
- Kartu sorotan beranda (hero) diganti ke game ini dengan tema pink; gambar promo `img/lava-salon-resto.jpg` (16:9) dan `img/lava-salon-resto-thumb.jpg` (kotak, untuk kartu) dirender dari aset game sendiri.
- Pemutar memakai mode **cinema**; atribut `allow` iframe ditambah `clipboard-write; web-share` supaya tombol Salin/Bagikan di dalam game berfungsi saat dibuka dari hub.

## Verifikasi yang Sudah Dilakukan

Uji otomatis Chromium headless pada 1280×800, 390×844 (HP tegak), 844×390 (HP mendatar), dan 820×1180 (tablet tegak), plus tangkapan layar 1024×768: alur pilih sahabat → salon & ganti baju → restoran → masak lewat mini-game → sajikan → progres tersimpan; semua layar tambahan (Jalan Sahabat, kirim kartu, Foto, Hewan, Dekor, Stiker, hadiah, naik level, akhir hari); semua menu dimasak di ukuran HP; serta alur link sahabat lewat server HTTP (perangkat A kirim link → perangkat B ketuk link → toko A muncul di jalan B) — tanpa error konsol. Rasa sentuhan & suara sebaiknya dicoba langsung di tablet/HP anak.
