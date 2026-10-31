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
