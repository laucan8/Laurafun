# PANAS BUMI: Harta Karun di Bawah Kaki Kita — video motion graphic 3D (±26 menit)

Video explainer YouTube berbahasa Indonesia tentang **cara kerja PLTP**, PLTP ikonik & proyek baru di Indonesia, teknologi generasi berikutnya, **duel PLTP vs PLTU**, **CAPEX per MW & LCOE** dibanding pembangkit lain, plus–minus vs energi terbarukan lain, dan **4 “teori konspirasi” yang dicek fakta**. Tema visual terang, 3D isometrik, sumber tercantum di setiap adegan.

| Item | Lokasi |
|---|---|
| Video (dipecah < 95 MB per bagian) | `output/PLTP_bagian_XX.mp4` + `output/playlist.json` |
| Pemutar berurutan (GitHub Pages) | `video-pltp/index.html` |
| Script narasi lengkap (+ timestamp) | `docs/SCRIPT.md` |
| Storyboard per adegan | `docs/STORYBOARD.md` |
| Daftar sumber + metodologi hitung | `docs/SUMBER.md` |
| Judul, deskripsi, timestamp bab YouTube | `docs/YOUTUBE_DESKRIPSI.md` |
| Subtitle Indonesia | `docs/subtitle_id.srt` |
| Klip voice-over per adegan | `build/audio/*.mp3` |

## Bagian video

| File | Rentang | Bab | Ukuran |
|---|---|---|---|
| `PLTP_bagian_00.mp4` | 00:00–01:26 | PEMBUKA — Harta karun di bawah kaki kita | 38.6 MB |
| `PLTP_bagian_01.mp4` | 01:26–02:40 | BAB 1 — Kenapa Indonesia? | 49.1 MB |
| `PLTP_bagian_02.mp4` | 02:40–04:00 | BAB 1 — Kenapa Indonesia? | 19.4 MB |
| `PLTP_bagian_03.mp4` | 04:00–05:00 | BAB 2 — Cara Kerja PLTP | 55.2 MB |
| `PLTP_bagian_04.mp4` | 05:00–06:00 | BAB 2 — Cara Kerja PLTP | 42.4 MB |
| `PLTP_bagian_05.mp4` | 06:00–07:36 | BAB 2 — Cara Kerja PLTP | 64.9 MB |
| `PLTP_bagian_06.mp4` | 07:36–09:38 | BAB 2 — Cara Kerja PLTP | 34.0 MB |
| `PLTP_bagian_07.mp4` | 09:38–11:52 | BAB 3 — PLTP Ikonik Indonesia | 62.9 MB |
| `PLTP_bagian_08.mp4` | 11:52–14:04 | BAB 4 — Teknologi Canggih & Masa Depan | 45.5 MB |
| `PLTP_bagian_09.mp4` | 14:04–16:00 | BAB 4 — Teknologi Canggih & Masa Depan | 27.0 MB |
| `PLTP_bagian_10.mp4` | 16:00–18:12 | BAB 5 — Duel: PLTP vs PLTU | 32.0 MB |
| `PLTP_bagian_11.mp4` | 18:12–19:42 | BAB 6 — Hitung-hitungan: CAPEX per MW | 9.4 MB |
| `PLTP_bagian_12.mp4` | 19:42–21:32 | BAB 6 — Hitung-hitungan: CAPEX per MW | 24.9 MB |
| `PLTP_bagian_13.mp4` | 21:32–22:50 | BAB 7 — Plus–Minus vs Energi Terbarukan Lain | 15.6 MB |
| `PLTP_bagian_14.mp4` | 22:50–24:28 | BAB 8 — Teori Terakhir & Penutup | 22.6 MB |
| `PLTP_bagian_15.mp4` | 24:28–25:50 | BAB 8 — Teori Terakhir & Penutup | 36.2 MB |

Total ±580 MB · durasi 25:50.

## Spesifikasi
- 1920×1080, 30 fps, H.264 (CRF 15) + AAC 256 kbps, loudness −14 LUFS (standar YouTube).
- 47 adegan + 8 bumper bab; 6 jenis transisi 3D (kubus, flip, pecah kaca, zoom-punch, heat-dissolve, carousel) + kamera kontinu antar-langkah di diorama PLTP.
- Narasi: suara neural Microsoft Edge TTS (`id-ID-ArdiNeural`, `id-ID-GadisNeural`). Musik & SFX: disintesis prosedural (orisinal, bebas royalti).

## Gabungkan bagian menjadi satu file (lossless, tanpa encode ulang)
Dari folder `video-pltp/output`:

```bash
ffmpeg -f concat -safe 0 -i gabung_list.txt -c copy PLTP_full.mp4
```

## Bangun ulang dari nol
```bash
python3 tools/script_src.py          # naskah -> script/script.json
python3 -I tools/tts.py              # voice-over + timing per kata (edge-tts)
python3 tools/build_timeline.py      # timeline engine
python3 tools/audio.py               # musik, SFX, mixing -> build/mix/final.wav
(cd engine && npx http-server -p 8800 -s .) &
node tools/render.js /path/render 4 1200   # render paralel (Chromium headless + Three.js)
python3 tools/assemble.py /path/render     # gabung, mux audio, potong per bagian
python3 tools/make_docs.py           # script, storyboard, sumber, deskripsi, SRT
```
Pratinjau adegan apa pun di browser: `engine/index.html?s=s10&l=6` (adegan s10 detik ke-6).

## Catatan penting
- Data diverifikasi ke sumber primer/berita resmi per Oktober 2026; beberapa angka (mis. potensi 23,7–24 GW, kapasitas 2.742–2.757 MW) berbeda tipis antar-sumber — yang dipakai dicantumkan di layar.
- Perhitungan LCOE, CAPEX per MW rata-rata, dan harga karbon impas adalah **ilustrasi** berbasis Katalog Teknologi Ditjen Gatrik ESDM & Danish Energy Agency (2024) — bukan rekomendasi investasi.
- Segmen teori konspirasi disajikan untuk diuji dengan data, bukan dibenarkan.
