import asyncio, ssl, json, os, sys, subprocess
sys.path.insert(0, os.path.dirname(__file__))
import edge_tts, edge_tts.communicate as c
from script_data import SCENES
c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
OUT = os.path.join(os.path.dirname(__file__), "..", "build", "tts")
os.makedirs(OUT, exist_ok=True)
VOICE = os.environ.get("VOICE", "id-ID-ArdiNeural")
sem = asyncio.Semaphore(4)
async def one(key, text):
    mp3 = f"{OUT}/{key}.mp3"; js = f"{OUT}/{key}.json"
    if os.path.exists(js) and json.load(open(js)).get("text") == text and os.path.getsize(mp3) > 1000:
        return
    async with sem:
        for attempt in range(5):
            try:
                comm = edge_tts.Communicate(text, VOICE, rate="+0%", boundary="WordBoundary")
                words = []
                with open(mp3, "wb") as f:
                    async for ch in comm.stream():
                        if ch["type"] == "audio": f.write(ch["data"])
                        elif ch["type"] == "WordBoundary":
                            words.append([ch["offset"]/1e7, (ch["offset"]+ch["duration"])/1e7, ch["text"]])
                wav = f"{OUT}/{key}.wav"
                subprocess.run(["ffmpeg","-y","-v","error","-i",mp3,"-ar","48000","-ac","1",wav], check=True)
                dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav]).strip())
                json.dump({"text": text, "words": words, "dur": dur}, open(js, "w"), ensure_ascii=False)
                print("ok", key, round(dur,2), flush=True); return
            except Exception as e:
                print("retry", key, e, flush=True); await asyncio.sleep(2*(attempt+1))
        raise RuntimeError("failed "+key)
async def main():
    tasks = []
    for s in SCENES:
        for i, (t, _) in enumerate(s["lines"]):
            tasks.append(one(f"{s['id']}_{i:02d}", t))
    await asyncio.gather(*tasks)
asyncio.run(main())
