# Laura di Jakarta — Hari Seru di Jakarta · Catatan Arsitektur

Game petualangan **dunia terbuka 3D** pertama di koleksi LaVa Games. Pemain berperan sebagai Laura, menjelajahi kota Jakarta mini (Sudirman–Bundaran HI–Menteng–Monas), membantu empat sahabatnya menyelesaikan misi, lalu menutup hari di Festival Lampion Monas. Seluruh teks UI dan dialog dalam bahasa Indonesia.

## Cara Menjalankan

Buka `laura-di-jakarta-3d.html` di browser modern ber-WebGL. File **sepenuhnya mandiri (~1 MB)**: three.js r160 dan dua font (Baloo 2, Lilita One) sudah ter-embed — **tidak butuh internet, tidak butuh build step**. Bisa langsung di-push ke GitHub Pages, dan sudah dijalankan lewat hub `index.html` (mode pemutar "cinema").

## Struktur Permainan

15 langkah misi berurutan (`const QUEST`), empat di antaranya menutup satu alur sahabat:

| Sahabat | Misi | Hadiah / pembuka |
|---|---|---|
| **Gracelyn** | Belanja roti, susu kotak, keripik di FamilyMart lalu bayar di kasir | Membuka alur Ailia |
| **Ailia** | Kejar Mochi, kucing yang kabur di Taman Menteng (3 titik persembunyian, salah satunya di atap) | Membuka alur Nikola |
| **Nikola** | Lomba ambil 10 balon mengelilingi City Walk dalam batas waktu | **Otopet** (tombol `Q` / tombol Otopet di layar sentuh) |
| **Zi En** | Foto 3 tempat ikonik — Tugu Monas, Bundaran HI, Stasiun MRT layang — untuk vlog | Membuka Festival Lampion |

Setelah festival, mode **jelajah bebas** terbuka: kumpulkan 30 stiker bintang dan permata di seluruh kota.

## Kontrol

- **Desktop:** `WASD` gerak · `Shift` lari · `Spasi` lompat · `E` bicara/foto · `Q` otopet · `J` jurnal · `Esc` jeda · seret mouse untuk memutar kamera.
- **Sentuh:** joystick virtual + tombol Bicara / Lompat / Otopet; ada peringatan untuk memutar HP ke posisi mendatar.

## Fitur Sistem

- **Dunia:** kota low-poly dengan landmark nyata (Monas, Bundaran HI, Grand Indonesia, Sudirman Park, Menara Astra/BNI/Indofood, City Walk, stasiun MRT layang, kampung warna-warni), lalu lintas dan pejalan kaki hidup, siklus waktu pagi → senja → malam festival.
- **NPC:** 4 sahabat + ±20 warga berdialog (satpam, tukang bakso, kerak telor, es kelapa, boba, ojek, juru parkir, kakek, turis, anak-anak) — masing-masing punya baris dialog kontekstual dan petunjuk misi.
- **Jurnal & peta:** minimap real-time, peta besar, daftar petunjuk, galeri foto hasil jepretan pemain.
- **Mode foto:** berdiri di penanda kamera → `E` → foto tersimpan di jurnal dan dipakai sebagai bukti misi Zi En.
- **Progresi tersimpan** di `localStorage` (menu "Lanjutkan" + "Simpan game" pada layar jeda).
- **Pengaturan:** kualitas grafik Hemat/Sedang/Tinggi, musik, efek suara, penghitung FPS, kecepatan kamera.
- **Presentasi:** splash studio, layar judul, sinematik dengan letterbox + caption + tombol Lewati, dan credit roll penutup.

## Integrasi ke Hub (`index.html`)

- Entri pertama di `window.LAVA_GAMES` (id `jakarta`, kategori **Petualangan** — kategori baru, chip filter muncul otomatis), sehingga menjadi sorotan besar dan target tombol "Main Sekarang" di hero.
- Gradien kartu baru `.art-jakarta` (senja amber → magenta → plum) agar tidak tertukar dengan kartu Bakery.
- Mode pemutar baru **`.player.cinema`** (maks 1600×1000, 84vh, offset 54px dari bilah judul; fullscreen di layar kecil) karena dunia terbuka 3D butuh area jauh lebih lebar dari mode `wide`.
- Hitungan "Game Siap Main" di hero kini dihitung dari data (`ready.length`), tidak lagi angka statis.

## Verifikasi yang Sudah Dilakukan

`node --check` untuk seluruh blok skrip `index.html`; render headless Chromium (SwiftShader) pada 1440×900: hub, sorotan, grid, chip kategori, modal detail, dan game dimuat di dalam iframe sampai layar judul 3D ter-render — tanpa error konsol atau `pageerror`. Gameplay penuh (misi, fisika, sentuh) perlu dicoba langsung di perangkat nyata.
