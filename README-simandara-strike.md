# Simandara Strike — Langit Nusantara · Catatan Arsitektur

Shooter arkade **3D dengan kamera dari atas** (gaya ding-dong 90-an) dengan alur cerita RPG. Pemain berperan sebagai **Letnan Dimas Juve** dari Skuadron Garuda yang bermarkas di **Malang**, melawan Armada Gagak pimpinan **Jenderal Rispo**. Seluruh teks UI, dialog, dan cutscene dalam bahasa Indonesia.

## Cara Menjalankan

Buka `simandara-strike.html` di browser modern ber-WebGL2. File **sepenuhnya mandiri (~1 MB)**: three.js r160 (termasuk post-processing bloom), tiga font (Black Ops One, Chakra Petch, Share Tech Mono), dan potret Dimas sudah ter-embed. **Tidak butuh internet dan tidak butuh build step.** Di hub `index.html` game ini dijalankan dengan mode pemutar "cinema".

## Kampanye — 26 misi, 6 bab

| Bab | Wilayah | Contoh misi |
|---|---|---|
| I | Jawa Timur | Banyuwangi, Kawah Ijen, Bromo → Markas Malang, Kediri, **Pesisir Lamongan**, Surabaya |
| II | Jawa Tengah & Barat | Semarang, Merapi, Dieng, Bandung, Jakarta |
| III | Sumatra | Krakatau, Way Kambas, Palembang, Danau Toba, Aceh |
| IV | Kalimantan & Sulawesi | Pontianak, Borneo, IKN, Makassar |
| V | Nusa Tenggara | Bali, Rinjani, Komodo |
| VI | Maluku & Papua | Laut Banda, Raja Ampat, Puncak Jaya |

Jenis misi: kalahkan boss, hancurkan target, kawal (Merpati / pesawat Presiden), bertahan, dan kejar pesawat siluman.
9 boss: Kalajengking, Ular Besi, Kelelawar, Hiu Besi, Kembar Kobra, Buto Ijo, Bayangan (Kolonel Sony), Naga Geni, Gagak Merah (Jenderal Rispo).

## Tokoh

Dimas Juve (foto asli), Kapten Rengga Jagoan, Presiden Benji, Dr. Laura Can, Louis Gan "GANAS" (bisa dipilih sebagai pilot), Nadira, Iman, Irtha, Yunita "Kenari", Kolonel Sony, Jenderal Rispo.

## Sistem

- **Progres RPG:** dana Rupiah per misi (rank S–D, kombo, serempet peluru, koin) → hanggar: 8 pesawat (terinspirasi T-50, F-16, AH-64, Su-30, Rafale, KF-21, F-22, prototipe GARUDA-X), 3 senjata, 9 jalur upgrade, lencana, dan kenaikan pangkat.
- **Simpan:** 3 slot di `localStorage`, disimpan otomatis. Ada juga "Kode Simpan" untuk memindahkan progres antarperangkat.
- **Grafis:** terrain prosedural per bioma (sawah, hutan, gunung berapi, kebun teh, kota malam, laut, karst), bayangan real-time, bloom, cuaca (hujan, badai, abu vulkanik). Kualitas Auto/Rendah/Sedang/Tinggi/Ultra, dan Auto turun sendiri kalau FPS < ~44.
- **Audio:** musik dan efek suara dibuat oleh Web Audio (nuansa gamelan), tanpa file audio.
- **Kontrol:** WASD/panah atau seret mouse · Shift fokus · X bom · Esc jeda · layar sentuh (geser + tombol BOM/FOKUS) · gamepad.

## Integrasi ke Hub (`index.html`)

- Entri pertama di `window.LAVA_GAMES` (id `simandara`, kategori baru **Aksi**), sehingga menjadi sorotan besar dan target tombol "Main Sekarang" di hero.
- Gradien kartu `.art-simandara` (navy langit malam → matahari emas-merah dengan garis lintasan).
- Ditambahkan ke daftar mode pemutar `cinema` bersama Laura di Jakarta.

## Catatan Build

Sumber dipecah menjadi modul (core, audio, data, render, models, world, fx, game, boss, cinema, ui, main), lalu di-bundle esbuild menjadi satu IIFE dan di-inline ke HTML ini.
