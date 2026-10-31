# PLTP vs PLTU — Motion Graphic 3D TikTok (Bahasa Indonesia)

Video explainer 9:16 (1080×1920, 30 fps, 3:01) tentang **cara kerja PLTP di Indonesia** dan **kenapa lebih unggul dari PLTU**, dengan "bumbu konspirasi" yang selalu diberi label *TEORI vs FAKTA*, VO Bahasa Indonesia, dan sumber di setiap klip.

Gaya visual meniru referensi (low-poly flat-shaded terang, HUD navy, callout ber-pin, tag dua warna, kartu info putih, caption karaoke).

## Isi folder

| Path | Isi |
|---|---|
| `out/pltp-vs-pltu-tiktok.mp4` | **Video final** (H.264 + AAC, −14 LUFS) |
| `out/cover.jpg` | Cover/thumbnail 1080×1920 |
| `out/captions.srt` | Subtitle (opsional, kalau mau upload caption terpisah) |
| `docs/storyboard.md` | Storyboard per scene: visual, kamera, overlay, VO, sumber |
| `docs/script-vo.md` | Naskah VO lengkap + teks layar + sumber per klip + draf caption TikTok |
| `docs/riset-sumber.md` | Tabel fakta + tautan sumber + perlakuan klaim konspirasi + catatan asumsi |
| `src/script.json` | **Sumber tunggal naskah** (VO markup, sumber per scene) |
| `src/tts.py` | VO neural (edge-tts `id-ID-ArdiNeural`), kompresi jeda, timing per kata → `build/timeline.json` |
| `src/world.js`, `src/plant.js` | Aset 3D prosedural (Three.js): terrain, gunung, PLTP penampang, PLTU, timbangan, peta |
| `src/director.js` | Kamera, transisi, animasi — semua di-cue ke timing kata VO |
| `src/overlay.js`, `src/cards.js`, `src/style.css` | HUD, callout, tag, kartu SVG, caption karaoke |
| `src/render.mjs` | Render deterministik frame-per-frame (Playwright + Chromium headless) → ffmpeg |
| `src/scan_events.mjs`, `src/audio.py` | Ekspor event visual → musik & SFX orisinal prosedural + mix + loudnorm |

## Build ulang

```bash
npm install                       # three.js
pip install edge-tts numpy        # VO + audio
python3 src/tts.py                # 1) VO + timeline (ubah naskah di src/script.json)
node src/scan_events.mjs          # 2) event overlay untuk SFX
python3 src/audio.py              # 3) musik + SFX + mix -> build/mix.wav
node src/render.mjs --video --workers 3      # 4) frame -> out/pltp_noaudio.mp4
ffmpeg -i out/pltp_noaudio.mp4 -i build/mix.wav -c:v copy -c:a aac -b:a 192k -shortest out/pltp-vs-pltu-tiktok.mp4
```

Preview interaktif: jalankan server statis di folder ini (mis. `python3 -m http.server`), buka `src/index.html`, klik untuk play dengan VO. `src/index.html?t=36` = satu frame di detik 36. `node src/render.mjs --stills 5,36,120` = still QA.

## Catatan

- Semua musik & SFX disintesis dari nol (tanpa sampel berlisensi). Font: Barlow Condensed (OFL), Inter, JetBrains Mono.
- Peta: outline negara sederhana dari `johan/world.geo.json` (turunan Natural Earth, domain publik). Posisi PLTP & titik potensi di peta bersifat ilustratif.
- Ilustrasi 3D tidak berskala (kedalaman strata dibesar-besarkan agar terbaca).
