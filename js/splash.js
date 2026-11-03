/* ============ Màn mở đầu: hộp quà lắc, bung nắp, Kuromi nhảy ra ============ */
const APP_NAME='Vương Quốc Vui Vẻ';
const SPLASH_MIN_MS=2900,SPLASH_MAX_MS=8000;
/* Tải trước ảnh Kuromi và các câu cố định đã có file; báo tiến độ 0..1 */
function splashPreload(onProgress){
  const urls=Object.values(MASCOT_IMG);
  const clips=Object.values(LINES).flat().map(x=>x.id).filter(id=>VOICE_FILES.includes(id));
  let done=0;const total=urls.length+clips.length;
  const tick=()=>{done++;onProgress(done/total)};
  const imgs=urls.map(u=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>{tick();r()};i.src=u}));
  clips.forEach(id=>{const a=new Audio();a.preload='auto';a.oncanplaythrough=a.onerror=tick;a.src=VOICE_DIR+id+'.mp3'});
  return Promise.all(imgs); // chỉ chờ ảnh; âm thanh tải tiếp ở nền
}
function splash(next){
  const el=document.createElement('div');el.className='splash';
  el.innerHTML=`<div class="srays"></div><div class="glow"></div>
  <div class="ttl1">${[...APP_NAME].map((c,i)=>`<span style="animation-delay:${(1.6+i*.06).toFixed(2)}s">${c===' '?'&nbsp;':c}</span>`).join('')}<small>học mà chơi cùng Kuromi 💜</small></div>
  <img class="mas" src="${MASCOT_IMG.happy}" alt="Kuromi" draggable="false">
  <div class="box"><div class="bd"></div><div class="lid"></div></div>
  <div class="bar"><i></i><b>⭐</b></div>
  <button class="btn p-pink gloss start">Vào ngay thôi !!</button>`;
  document.body.appendChild(el);
  const fill=el.querySelector('.bar i'),star=el.querySelector('.bar b');
  const t0=Date.now();
  /* thanh tải chạy theo thời gian hiệu ứng và tiến độ tải, cái nào chậm hơn */
  let prog=0;const show=()=>{const p=Math.min(prog,(Date.now()-t0)/SPLASH_MIN_MS);fill.style.width=star.style.left=(p*100)+'%'};
  const iv=setInterval(show,100);
  let ready=false;const setReady=()=>{if(ready)return;ready=true;clearInterval(iv);prog=1;fill.style.width=star.style.left='100%';el.classList.add('ready')};
  const loaded=splashPreload(p=>{prog=Math.max(prog,p)});
  Promise.all([loaded,new Promise(r=>setTimeout(r,SPLASH_MIN_MS))]).then(setReady);
  setTimeout(setReady,SPLASH_MAX_MS);
  setTimeout(()=>{confetti(26);for(let k=0;k<10;k++){const s=document.createElement('span');s.className='spk';s.textContent='✦';
    s.style.left=(10+Math.random()*80)+'%';s.style.top=(10+Math.random()*70)+'%';s.style.animationDelay=(Math.random()*1.5).toFixed(2)+'s';
    el.appendChild(s);setTimeout(()=>s.remove(),3000)}},1500);
  let went=false;
  el.querySelector('.start').onclick=()=>{
    if(went)return;went=true;
    voice.unlock();sfx.ok();voice.line('splash');
    el.classList.add('leave');setTimeout(()=>el.remove(),400);
    next();
  };
}
