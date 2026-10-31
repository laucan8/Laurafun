import json,subprocess,sys,os
tl=json.load(open('engine/timeline.json'))
frac=float(sys.argv[1]) if len(sys.argv)>1 else 0.6
ids=sys.argv[2].split(',') if len(sys.argv)>2 else [s['id'] for s in tl['scenes']]
specs=[]
for s in tl['scenes']:
    if s['id'] in ids: specs.append(f"{s['id']}@{s['dur']*frac:.2f}")
out='/tmp/qa_all'; os.makedirs(out,exist_ok=True)
env=dict(os.environ,NODE_PATH='/opt/node22/lib/node_modules')
r=subprocess.run(['node','tools/still.js',out]+specs,capture_output=True,text=True,env=env)
print(r.stdout[-4000:]); print(r.stderr[-2000:])
from PIL import Image
files=[os.path.join(out,sp.replace('@','_')+'.png') for sp in specs]
files=[f for f in files if os.path.exists(f)]
for k in range(0,len(files),9):
    ims=[Image.open(f).convert('RGB').resize((960,540)) for f in files[k:k+9]]
    sheet=Image.new('RGB',(2880,1620),'white')
    for i,im in enumerate(ims): sheet.paste(im,((i%3)*960,(i//3)*540))
    sheet.save(f'{out}/sheet_{k//9}.jpg',quality=82)
print('sheets',(len(files)+8)//9)
