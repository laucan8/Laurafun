// tiny static server
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.css':'text/css'};
module.exports=function start(port){return new Promise(r=>{const s=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/src/index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('nf '+p);}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});s.listen(port,()=>r(s));});};
if(require.main===module){module.exports(+process.argv[2]||8080).then(()=>console.log('up'));}
