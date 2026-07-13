# Lava Globe — Jelajah Dunia · Catatan Arsitektur

Game edukasi globe 3D untuk anak SD: jelajahi bumi, kenali negara, main trivia. Semua teks UI bahasa Indonesia.

## Cara Menjalankan

Buka `lava-globe-dunia.html` di browser modern — butuh **internet** (peta negara, tekstur bumi satelit, library globe, dan gambar bendera dimuat dari CDN) dan WebGL. Optimal di desktop & tablet; usable di HP landscape. Bisa langsung di-push ke GitHub Pages tanpa build step.

## Tiga Mode

- **🌍 Jelajah** — putar/zoom globe (inertial damping), ketuk negara → kamera terbang sinematik + highlight cincin gelombang + panel kartu belajar kaca muncul dengan animasi bertingkat. Search bar dengan autocomplete (nama negara/ibu kota, navigasi keyboard).
- **🎯 Trivia** — 10 soal prosedural dari 6 tipe (bendera, ibu kota, mata uang, terkenal-dengan, benua, penduduk-terbanyak), 2 kesulitan (Mudah: pengecoh beda benua / Menantang: sebenua). Skor, progres, confetti, dan **momen belajar**: setiap jawaban → globe terbang ke negara yang benar. Akhir ronde: bintang 1–3.
- **⚡ Belajar Cepat** — 8 kategori kartu (per benua, Penduduk Terbanyak, Ekonomi Raksasa, Super Ikonik); ketuk kartu → guided discovery ke negara.

## Kartu Info Negara

Bendera (flagcdn, fallback emoji) · ibu kota · benua/kawasan · mata uang · sistem pemerintahan · bahasa · **penduduk dengan ikon 🧍 berskala (1 ≈ 50 juta, maks 10)** · **GDP dengan koin 🪙 berskala (1 ≈ US$500 miliar)** · terkenal-dengan (chips) · landmark. Nama samudra tampil halus di globe.

## Arsitektur (single-file, section modular)

`CSS design system → HTML skeleton → DATA (pure) → GENERATOR TRIVIA (pure) → ASET/UTIL → AUDIO → GLOBE → PANEL → SEARCH → MODE → BELAJAR → TRIVIA UI → FX → BOOT`

Dependensi CDN (terverifikasi): **globe.gl 2.46.1** via jsdelivr `+esm` (engine globe Three.js: picking polygon, pointOfView sinematik, atmosphere, rings, label, graticule), **topojson-client 3.1.0**, **world-atlas 2.0.2 (50m — 241 negara, termasuk Singapura)**, tekstur bumi blue-marble + bump + langit bintang dari paket three-globe, bendera flagcdn.

**Data:** 36 negara kurasi ramah-anak di-embed lokal (offline-first — API bukan dependensi runtime). Menambah negara = tambah satu objek di `COUNTRIES` (kode ISO numerik cocok world-atlas) → otomatis masuk globe, search, trivia, dan belajar cepat.

## Verifikasi yang Sudah Dilakukan

Sintaks modul lolos `node --check`; versi & path semua paket CDN dicek terhadap registry npm; ID negara dataset dicocokkan dengan TopoJSON (36/36); logic murni diuji headless: integritas data + **4.000 soal trivia** tergenerasi valid (4 opsi unik, jawaban selalu ada, soal populasi/bendera/benua konsisten); konsistensi ID elemen HTML↔JS. Visual 3D perlu dicek langsung di browser (lingkungan dev tanpa GPU).

## Batasan & Ide Lanjutan

Data angka (penduduk/GDP) adalah perkiraan dibulatkan yang ramah anak, bukan data real-time; integrasi REST Countries/World Bank bisa ditambah sebagai enrichment opsional. Negara di luar 36 kurasi tetap tampil & bisa disentuh (muncul toast ajakan). Ide berikutnya: mode "Paspor" (stiker negara yang sudah dikunjungi), suara narasi, lebih banyak negara.
