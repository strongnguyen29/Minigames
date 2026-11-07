/* Phát hiện bản mới: so <meta name="app-version"> với version.json (luôn lấy mới từ mạng).
   Khác nhau → hiện nút "Có bản mới", bấm để tải lại (không tự reload giữa lúc bé đang chơi). */
const UPDATE_RECHECK_MS=10*60*1000;
let _updShown=false,_updLast=0;

function appVersion(){
  const m=document.querySelector('meta[name="app-version"]');
  return m&&m.content||'';
}

function showUpdate(v){
  if(_updShown)return;
  _updShown=true;
  const b=document.createElement('button');
  b.className='update-banner';
  b.textContent='✨ Có bản mới! Bấm để cập nhật';
  b.onclick=()=>location.replace(location.pathname+'?v='+encodeURIComponent(v));
  document.body.appendChild(b);
}

async function checkUpdate(){
  const cur=appVersion();
  if(!cur||_updShown||typeof fetch!=='function')return;
  _updLast=Date.now();
  try{
    const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)return;
    const {v}=await r.json();
    if(v&&v!==cur)showUpdate(v);
  }catch(e){/* offline: bỏ qua, lần sau kiểm tra lại */}
}

function initUpdateCheck(){
  setTimeout(checkUpdate,3000);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&Date.now()-_updLast>UPDATE_RECHECK_MS)checkUpdate();
  });
}
