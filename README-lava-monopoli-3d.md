# Lava Monopoli 3D — Catatan Arsitektur

Upgrade presentation layer `lava-monopoli.html` menjadi 3D premium (Three.js). **Rules engine 100% sama** — tidak ada aturan main yang diubah.

## Cara Menjalankan

Buka `lava-monopoli-3d.html` di browser modern (Chrome/Edge/Safari/Firefox). Butuh **koneksi internet** (Three.js dimuat dari CDN jsdelivr) dan WebGL aktif. Bisa dibuka langsung dari file (double-click) atau via GitHub Pages — tanpa build step.

Versi 2D original tetap utuh di `lava-monopoli.html` sebagai fallback. Jika WebGL/CDN gagal, layar loading otomatis menawarkan link ke versi 2D.

## Struktur File

Satu file, tiga blok (mengikuti konvensi project: semua game single-file):

| Blok | Lokasi dalam file | Isi |
|---|---|---|
| CSS + HTML | atas | Welcome, setup, HUD glass overlay, modal (disalin/diadaptasi dari versi 2D) |
| `R3D` renderer | `<script type="module">` bagian atas | Semua kode Three.js: papan, token, dadu, kamera, lighting, post-processing |
| Engine | bagian bawah script | Rules engine disalin verbatim dari `lava-monopoli.html` |

## Kontrak Engine ↔ Renderer (bridge)

Engine tidak tahu Three.js. Ia hanya memanggil:

`R3D.start()` bangun scene · `R3D.sync()` sinkron penuh state→3D (kepemilikan, rumah/hotel, gadai, posisi token, highlight) · `R3D.stepToken(p)` animasi lompat satu tile (await) · `R3D.rollDice(d1,d2)` dadu tumble, hasil MENGIKUTI RNG engine · `R3D.buyFx/buildFx/jailFx/winFx` efek · `R3D.focusPlayer(p)` kamera sinematik.

Titik panggil di engine ditandai komentar `/* 3D: ... */` — hanya itu bedanya dari versi 2D.

## Yang Dipertahankan vs Direfactor

- **Dipertahankan verbatim:** BOARD_DEF, kartu CHANCE/CHEST, turn flow, sewa, lelang, gadai, trade, AI, kebangkrutan, seluruh UI modal & sidebar (kini styled glass).
- **Direfactor minimal:** `moveForwardRoll/moveAnimateTo/moveAnimateBy` — dulu `placeTokens()+sleep(110)` per langkah, kini `await R3D.stepToken(p)`. `rollDice` — animasi CSS dadu diganti dadu 3D. `buildBoardDOM/renderBoardOwnership/renderDice` (murni render 2D) digantikan scene 3D.

## Art Direction & Grafis

Meja walnut prosedural, alas papan black lacquer + trim kuningan, felt tengah mengikuti tema yang dipilih, token pion metalik + emblem, rumah/hotel via InstancedMesh, environment lighting (RoomEnvironment), ACES tone mapping, soft shadow, bloom subtle + vignette.

## Performa

- Auto-detect: perangkat sentuh / layar kecil → mode **Ringan** (tanpa post-processing, shadow 1024, pixel ratio ≤1.5). Tombol ✦ kanan-bawah untuk toggle manual.
- Draw call rendah: 40 tile + label, token ≤4, dadu 2, rumah/hotel instanced.
- Rekomendasi minimum: GPU terintegrasi 2018+ / HP mid-range 2020+.

## Verifikasi yang Sudah Dilakukan

Sintaks modul lolos `node --check`; semua path import CDN tervalidasi terhadap paket three@0.160.0; engine diuji headless (jsdom, renderer di-stub): 4 AI bermain otomatis — dadu, pembelian, sewa, kartu, dobel berjalan tanpa error.
