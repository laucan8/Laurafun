"""Build out/captions.srt from build/timeline.json (sentence-ish chunks)."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(ROOT, 'build', 'timeline.json'), encoding='utf-8'))
def ts(x):
    h, m = int(x // 3600), int(x % 3600 // 60); s = x % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
cues = []
for sc in tl['scenes']:
    cur = []
    for i, tk in enumerate(sc['tokens']):
        cur.append(tk)
        txt = ' '.join(t['d'] for t in cur)
        if re.search(r'[.?!]$', tk['d']) or (re.search(r'[:,]$', tk['d']) and len(txt) > 18) or len(txt) > 38 or i == len(sc['tokens']) - 1:
            cues.append([cur[0]['t0'], cur[-1]['t1'] + 0.15, txt])
            cur = []
for i, c in enumerate(cues):
    if i + 1 < len(cues): c[1] = min(c[1], cues[i + 1][0] - 0.02)
out = [f"{i+1}\n{ts(a)} --> {ts(b)}\n{t}\n" for i, (a, b, t) in enumerate(cues)]
n = len(cues)
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
open(os.path.join(ROOT, 'out', 'captions.srt'), 'w', encoding='utf-8').write('\n'.join(out))
print('srt cues', n)
