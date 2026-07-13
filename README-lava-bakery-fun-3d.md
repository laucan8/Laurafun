# Lava Bakery Fun 3D — Catatan Arsitektur

Upgrade presentation layer `lava-bakery-fun.html` menjadi kafe pâtisserie Prancis 3D (Three.js). **Seluruh gameplay logic asli dipertahankan** — kurva kesulitan, patience, combo, koin, XP, unlock, semuanya identik.

## Cara Menjalankan

Buka `lava-bakery-fun-3d.html` di browser modern (butuh internet — Three.js dari CDN jsdelivr — dan WebGL). Didesain portrait/HP seperti aslinya; di desktop tampil sebagai stage 430×880. Versi 2D original tetap utuh di `lava-bakery-fun.html`; jika 3D gagal dimuat, layar loading menampilkan link ke versi 2D.

## Struktur File (single-file, 3 blok)

| Blok | Isi |
|---|---|
| CSS + HTML | HUD/deck/layar — **ID & class 100% sama** dengan versi 2D, hanya di-reskin premium (ivory, brass, marble, Playfair Display) |
| `R3D` renderer | Semua Three.js: kafe, Laura, pengunjung, partikel, kamera, post-processing |
| Engine | Logic asli disalin verbatim |

## Arsitektur: logic → state → renderer

Renderer **membaca state `G` setiap frame** (bukan event bridge) karena `update(dt)` asli sudah menghitung posisi pengunjung, patience, dan partikel dalam koordinat 430×880. Pemetaan `GX/GZ` mengubah koordinat logic → dunia 3D, jadi timing gameplay tidak berubah sedikit pun.

Perubahan pada engine hanya: fungsi gambar Canvas 2D (`draw*`) dihapus (digantikan R3D), `loop()` jadi murni logic, dan satu baris `R3D.pulse()` saat serve sukses. Ditandai komentar.

## Update v2 (upgrade signifikan)

- **Kamera diperlebar** — seluruh 4 meja, pintu masuk, dan konter terlihat dalam satu frame (konstanta `CAM_POS/CAM_TGT/CAM_FOV` di bagian atas modul R3D, mudah di-tweak).
- **Karakter manusia penuh** — kepala + wajah digambar tangan (3 ekspresi: netral/senang/sedih dengan air mata), badan, lengan, kaki dengan siklus jalan kaki, lalu **duduk di kursi** di meja, baru memesan (bubble muncul saat duduk). Variasi gaya & warna rambut, warna baju per pengunjung.
- **Pulang senang vs sedih** — dilayani benar: wajah tersenyum + emote 💖 sambil jalan keluar; terlambat: wajah sedih menangis + emote 💔.
- **Pelayan** — karakter vest hitam + apron + dasi kupu yang berjalan membawa nampan berisi pesanan ke meja pengunjung saat serve sukses, meletakkannya, lalu kembali standby.
- **Laura = chef pemilik** — jaket chef putih double-breasted, toque, apron rose: menguleni adonan di konter marble (adonan memipih mengikuti gerakan tangan, ada rolling pin & tepung), menoleh dan mengambil kue saat Anda menekan tray, melompat gembira saat serve sukses. Display roti: cake stand, loaf di konter, rak baguette, keranjang roti.
- **Grafis dinaikkan** — tekstur 512–1024px, clearcoat pada marble & parket, pixel ratio hingga 2.5 (desktop), shadow lebih halus, grading kontras + bloom.

Hook engine kini `R3D.serveFx(target)` (menggantikan `R3D.pulse()`) — tetap satu baris, logic lain tak berubah.

## Konten 3D

- **Kafe:** lantai parket, dinding krem + wainscoting + trim brass, pintu lengkung, jendela cahaya siang, papan menu kapur "Menu — fait avec amour", signage Playfair "Lava Bakery Pâtisserie", string lights, lampu gantung brass, tanaman, karpet rose.
- **Etalase:** konter kayu rose + top marble + kaca + tiang brass, dua rak pastry (macaron, donat, croissant, cupcake, gâteau — semua mesh handcrafted), cake stand brass, kasir, awning strip.
- **Dapur:** oven bata dengan bara menyala + uap animasi, rak baguette, keranjang roti.
- **Laura:** karakter proxy stylized (rok rose, apron, blouse, beret, sanggul + pita, wajah hand-drawn 2 ekspresi). Animasi: idle bob, angkat tangan saat ambil kue (`armT`), lompat senang + wajah ^‿^ saat serve (`happy`) — semuanya dari state asli. Arsitektur siap diganti model GLTF nanti (satu fungsi `makeLaura`).
- **Pengunjung:** jalan masuk dari pintu → duduk → pergi (state machine asli), bubble pesanan 3D, patience bar hijau→amber→merah, wajah emoji berubah 😍/😣 sesuai logic.
- **Kamera:** sinematik terkunci + sway halus + push-in saat serve.

## Performa

Auto-quality: perangkat sentuh → tanpa post-processing, pixel ratio ≤1.6. Desktop: bloom subtle + vignette + grading hangat (ACES). Satu shadow light; pastry kecil tanpa shadow; bulbs instanced. Butuh browser dengan `canvas.roundRect` (Chrome 99+ / Safari 16+ / Firefox 112+).

## Verifikasi

Sintaks lolos `node --check`; path CDN tervalidasi; gameplay diuji headless (jsdom, R3D stub): bot meracik pesanan nyata → serve sukses (+17 koin, bonus speed benar), serve salah → combo reset, HUD sinkron — nol error.

## Batasan

Visual 3D belum bisa saya screenshot dari lingkungan pengembangan (tanpa GPU) — jika ada elemen yang posisinya kurang pas di layar Anda, kirim screenshot untuk penyesuaian cepat. Audio memakai SFX WebAudio asli; ambience kafe belum ditambahkan.
