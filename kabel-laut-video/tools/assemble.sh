#!/bin/bash
# concat rendered chunks, mux audio, split into chapter parts
set -e
cd "$(dirname "$0")/.."
mkdir -p out
ls build/chunks/c_*.mp4 | grep -v tmp | sort | sed "s#^#file '$PWD/#; s#\$#'#" > build/concat.txt
ffmpeg -y -v error -f concat -safe 0 -i build/concat.txt -i build/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/NADI_DI_DASAR_LAUT_FULL_1080p.mp4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 out/NADI_DI_DASAR_LAUT_FULL_1080p.mp4
# split at chapter starts (stream copy, cuts on nearest keyframe; GOP=2s)
TIMES=$(python3 -c "import json;tl=json.load(open('build/timeline.json'));print(','.join(str(s['start']) for s in tl['scenes'][1:]))")
ffmpeg -y -v error -i out/NADI_DI_DASAR_LAUT_FULL_1080p.mp4 -c copy -map 0 -f segment -segment_times "$TIMES" -reset_timestamps 1 -movflags +faststart "out/part_%02d.mp4"
python3 - <<'PY'
import json, os
tl = json.load(open('build/timeline.json'))
names = ['00_Pembuka','01_Kronologi','02_Perjalanan_Klik','03_Anatomi_Kabel','04_Cahaya_Repeater','05_Kenapa_Singapura','06_Cek_Fakta_90persen','07_Teori_Konspirasi','08_Simulasi_Putus','09_Perbaikan_Kabel','10_Solusi','11_Penutup']
for i, n in enumerate(names):
    src = f'out/part_{i:02d}.mp4'
    if os.path.exists(src): os.replace(src, f'out/Bagian_{n}.mp4')
PY
ls -la out/
