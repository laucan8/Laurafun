# Simandara Delivery Chaos: Pro Rider — Catatan Arsitektur

Game ojol **3D orang ketiga** (kamera chase dekat di belakang motor, gaya SnowRunner). Pemain berperan sebagai **Dimas Juve**, rider SIMANDARA, mengantar makanan, paket, dan penumpang di **10 kota Indonesia** sambil menghadapi GAGAK Express pimpinan **Bos Iman** dan tangan kanannya **Nadira**. Seluruh teks UI dan dialog berbahasa Indonesia.

## Cara Menjalankan

Buka `simandara-delivery-chaos.html` di browser modern ber-WebGL2. File **sepenuhnya mandiri (~1,3 MB)**: three.js r160 + post-processing, font, dan semua aset prosedural sudah ter-embed. Tidak butuh internet dan tidak butuh build step. Di hub `index.html` game ini dijalankan dengan mode pemutar "cinema".

## Kota & Misi Cerita

Banyuwangi → Lamongan → Malang → Palu → Denpasar → Pangkalpinang → Gorontalo → Medan → Surabaya → Jakarta. Tiap kota punya target order dan satu misi cerita (antar, ojek penumpang, balapan, kejar bentor, final di Menara SIMANDARA).

## Tokoh

Dimas Juve, Rengga Jagoan (Bengkel Jagoan), Laura (operator pusat), Yunita (Korlap Ojol), Louis Gan, Irtha "Kenari" (Juragan Katering), Agustian (Raja Gang Tikus), Benji, Bos Iman (CEO GAGAK Express), Nadira (tangan kanan Bos Iman), Sony.

## Sistem

- **Kamera:** Dekat (default) / Sedang / Atas — tombol C, 🎥, atau R3. Seret layar/mouse atau stik kanan untuk melihat sekeliling; kamera kembali otomatis.
- **Motor:** 7 motor (skutik sampai prototipe MotoGP emas) dengan model detail, upgrade tanpa batas di Bengkel Jagoan, cat custom.
- **Dunia:** kota prosedural (jalan, gang, ruko, minimarket, gedung), lalu lintas AI, pejalan kaki, lampu lalu lintas, kereta.
- **Grafis:** siang–malam, hujan, kabut, debu; bayangan real-time, langit dinamis, lampu kota, pantulan jalan basah. Tanpa efek blur saat bermain. Kualitas Rendah/Sedang/Tinggi/Ultra.
- **Kontrol:** keyboard (WASD/panah, Spasi ngepot, H telolet, Q/E tendang spion), gamepad, dan layar sentuh.
- **Simpan:** otomatis di `localStorage` + kode simpan.

## Integrasi ke Hub (`index.html`)

- Entri pertama di `window.LAVA_GAMES` (id `delivery`, kategori baru **Balap**) → sorotan besar dan target tombol "Main Sekarang".
- Hero beranda menampilkan kartu "Rilis Baru" dengan screenshot asli (`img/simandara-delivery-chaos.jpg`); kartu katalog memakai `img/simandara-delivery-chaos-thumb.jpg`.
- Masuk daftar pemutar `cinema`; iframe diberi fokus otomatis agar keyboard langsung jalan.

## Catatan Build

Sumber modular (core, data, render, world, entities, game, ui) di-bundle esbuild menjadi satu IIFE lalu di-inline ke HTML.
