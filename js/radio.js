/* ============ Tiệm âm thanh ============ */
/* File nghe nằm ngay trong source, tính từ AUDIO_BASE (vd. audio/stories/ngoi-sao-nho-di-lac.m4a).
   Chuyển lên Cloudflare R2: tải file lên R2 giữ nguyên đường dẫn (stories/ngoi-sao-nho-di-lac.m4a…)
   rồi điền AUDIO_CDN = 'https://<tên miền cdn>/'. Món nào ghi file là link đầy đủ (https://…) thì dùng nguyên link */
const AUDIO_CDN='';
const AUDIO_BASE='audio/';
/* Mỗi ngày được nghe miễn phí LISTEN_FREE_MIN phút (tính riêng từng máy); hết thì đổi sao lấy thêm phút */
const LISTEN_FREE_MIN=5;
const LISTEN_PACKS=[{min:5,price:5},{min:15,price:12}];
/* Nghe dở từ chừng này giây trở lên (và chưa tới đoạn cuối) thì hỏi nghe tiếp hay nghe từ đầu */
const RESUME_MIN=5;
/* Mỗi món: [file, tên hiển thị, giá (số sao; 0 = miễn phí), biểu tượng] */
const RADIO=[
  {id:'song',icon:'🎵',name:'Bài hát',items:[
    ['music/kuromi-lofi.m4a','Giai điệu Kuromi',0,'🎧'],
    ['songs/xuan-sum-vay.mp3','Xuân Sum Vầy',0,'🧧'],
    ['songs/tet-dong-day.mp3','Tết Đong Đầy',10,'🏮'],
    ['songs/golden.mp3','Golden',15,'✨']
  ]},
  {id:'story',icon:'📖',name:'Câu chuyện',items:[
    ['stories/tho-con-va-cu-ca-rot.m4a','Thỏ con và củ cà rốt',0,'🥕'],
    ['stories/ngoi-sao-nho-di-lac.m4a','Ngôi sao nhỏ đi lạc',8,'🌟']
  ]}
];
/* id = đường dẫn file bỏ tên miền và đuôi (giữ nguyên khi chuyển file sang CDN) */
const RADIO_ITEMS=RADIO.flatMap(c=>c.items.map(([file,name,price,icon])=>({
  id:file.replace(/^https?:\/\/[^/]+\//,'').replace(/\.[^./]+$/,''),cat:c.id,file,name,price,icon})));
const radioItem=id=>RADIO_ITEMS.find(x=>x.id===id);
const radioUrl=it=>/^https?:\/\//.test(it.file)?it.file:(AUDIO_CDN||AUDIO_BASE)+it.file;
const hasSong=id=>{const it=radioItem(id);return !!it&&(it.price<=0||(S.songs||[]).includes(id))};
/* sao đã tiêu ở tiệm này: bài đã đổi + phút nghe đã đổi trên mọi máy (balance() trừ phần này) */
function radioSpent(){
  const songs=(S.songs||[]).reduce((n,id)=>{const it=radioItem(id);return n+(it?it.price:0)},0);
  return songs+Object.values(S.listenSpent||{}).reduce((n,v)=>n+(v||0),0);
}
/* Phút nghe trên máy này: used = giây miễn phí đã nghe hôm nay, paid = giây đã đổi sao còn lại,
   pos = chỗ dừng gần nhất {id:[giây, độ dài bài]} */
function listenState(){
  let l=S.listen;
  if(!l||typeof l!=='object')l=S.listen={day:'',used:0,paid:0,pos:{}};
  if(!l.pos)l.pos={};
  const t=dayStr(new Date());
  if(l.day!==t){l.day=t;l.used=0}
  return l;
}
const listenLeft=()=>{const l=listenState();return Math.max(0,LISTEN_FREE_MIN*60-l.used)+Math.max(0,l.paid||0)};
const mmss=s=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};

/* ---- Máy phát: một phần tử Audio dùng chung; chỉ phát khi đang ở Tiệm âm thanh ---- */
let radioEl=null,radioCur=null,radioIv=0,radioLast=0,radioN=0,radioSeeking=false;
let radioTab=RADIO[0].id;
const playing=()=>!!radioEl&&!!radioCur&&!radioEl.paused;
const radioDur=()=>radioEl&&isFinite(radioEl.duration)?radioEl.duration:0;
function radioAudio(){
  if(radioEl)return radioEl;
  radioEl=new Audio();radioEl.preload='metadata';
  radioEl.addEventListener('timeupdate',radioUI);
  radioEl.addEventListener('loadedmetadata',radioUI);
  /* nghe hết bài: quên chỗ dừng, lần sau mở là nghe từ đầu */
  radioEl.addEventListener('ended',()=>{radioCharge();clearInterval(radioIv);radioIv=0;
    if(radioCur)delete listenState().pos[radioCur];save();radioUI()});
  radioEl.addEventListener('error',()=>{if(!radioCur)return;clearInterval(radioIv);radioIv=0;radioUI();
    const e=$('#rname');if(e)e.textContent='Chưa tải được bài này 😢'});
  return radioEl;
}
/* nhớ chỗ đang nghe của bài hiện tại */
function radioMark(){if(radioEl&&radioCur)listenState().pos[radioCur]=[radioEl.currentTime||0,radioDur()]}
/* trừ thời gian đã nghe theo giờ thật (miễn phí trước, rồi tới phút đã đổi) */
function radioCharge(){
  const now=Date.now(),dt=Math.min(5,Math.max(0,(now-radioLast)/1000));radioLast=now;
  if(!playing())return;
  const l=listenState(),f=Math.min(dt,Math.max(0,LISTEN_FREE_MIN*60-l.used));
  l.used+=f;l.paid=Math.max(0,(l.paid||0)-(dt-f));
  radioMark();
}
function radioTick(){
  radioCharge();
  if(playing()&&listenLeft()<=0){radioPause();radioMinutes(true);return}
  if(++radioN%5===0)save();
  radioUI();
}
function radioPlay(){
  if(!radioCur)return;
  if(listenLeft()<=0){radioMinutes(true);return}
  voice.stop();
  const a=radioAudio();radioLast=Date.now();
  try{const p=a.play();p&&p.catch&&p.catch(()=>radioUI())}catch(e){}
  if(!radioIv)radioIv=setInterval(radioTick,1000);
  radioUI();
}
function radioPause(){
  radioCharge();
  if(radioEl)try{radioEl.pause()}catch(e){}
  clearInterval(radioIv);radioIv=0;
  radioMark();save();radioUI();
}
/* rời Tiệm âm thanh (gọi trong go): dừng bài, nhớ chỗ dừng */
function radioStop(){
  if(!radioEl||!radioCur)return;
  radioPause();radioCur=null;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing())radioPause()});
/* at: giây bắt đầu; nhảy tới sau khi có metadata (Safari bỏ qua currentTime khi chưa biết độ dài) */
function radioLoad(it,at){
  const a=radioAudio();radioCur=it.id;
  a.src=radioUrl(it);
  if(at>0){const seek=()=>{a.removeEventListener('loadedmetadata',seek);try{a.currentTime=at}catch(e){}};a.addEventListener('loadedmetadata',seek)}
  radioPlay();
}
function radioSkip(d){
  if(!radioEl||!radioCur)return;
  const end=radioDur()||Infinity;
  try{radioEl.currentTime=Math.max(0,Math.min(end-.5,(radioEl.currentTime||0)+d))}catch(e){}
  radioMark();radioUI();
}
/* Đang phát bài thì Kuromi chỉ hiện chữ, không nói đè lên bài */
function rsay(group,opts={}){
  if(!playing())return mascotSay(group,opts);
  const l=voice.pick(group);mascot(opts.emo||l.emo,opts.format?opts.format(l.text):l.text);
}

/* ---- Mở bài: chưa có thì hỏi đổi sao; có chỗ dừng cũ thì hỏi nghe tiếp hay nghe từ đầu ---- */
function radioOpen(id){
  const it=radioItem(id);if(!it)return;
  if(!hasSong(id)){radioLocked(id);return}
  if(id===radioCur){playing()?radioPause():radioPlay();return}
  sfx.click();
  if(playing())radioPause();
  const p=listenState().pos[id],at=p?p[0]:0,dur=p?p[1]:0;
  if(at>=RESUME_MIN&&!(dur&&at>dur-RESUME_MIN)){
    const m=modalBox(`<div class="rcover big">${it.icon}</div><h2>${esc(it.name)}</h2>
      <p class="sub">Lần trước bạn nghe tới <b>${mmss(at)}</b>${dur?` / ${mmss(dur)}`:''}</p>
      <div class="row"><button class="btn p-pink gloss" id="rcont">▶️ Nghe tiếp</button><button class="btn p-blue" id="rbeg">⏮️ Nghe từ đầu</button></div>`);
    $('#rcont').onclick=()=>{m.remove();radioLoad(it,at)};
    $('#rbeg').onclick=()=>{m.remove();radioLoad(it,0)};
    return;
  }
  radioLoad(it,0);
}
function radioLocked(id){
  const it=radioItem(id);if(!it||hasSong(id))return;
  sfx.click();
  const need=it.price-balance(),ok=need<=0;
  if(!ok)rsay('radio_poor',{format:t=>`Cần ${it.price} ⭐ nha! ${t}`});
  const m=modalBox(`<div class="rcover big">${it.icon}</div><h2 style="margin:6px 0">${esc(it.name)}</h2>
    <p class="sub">Giá: <b>${it.price} ⭐</b> · Bạn đang có <b>${balance()} ⭐</b></p>
    ${ok?'':`<div class="toast">Bạn cần thêm ${need} ⭐ nữa! Chơi game để kiếm sao nhé 🎮</div>`}
    <div class="row">${ok?`<button class="btn p-pink gloss" id="buy">🎵 Đổi ngay</button>`:`<button class="btn p-blue" id="play">🎮 Chơi game kiếm sao</button>`}<button class="btn p-gray" id="cl">Để sau</button></div>`);
  $('#cl').onclick=()=>m.remove();
  const b=$('#buy');if(b)b.onclick=()=>radioBuy(id,m);
  const p=$('#play');if(p)p.onclick=()=>{m.remove();sfx.click();go(home)};
}
function radioBuy(id,m){
  const it=radioItem(id);
  if(!it||hasSong(id))return;
  if(balance()<it.price){sfx.bad();return}
  S.songs=[...(S.songs||[]),id];save();
  sfx.win();confetti(40);m&&m.remove();
  radio(true);rsay('radio_buy');
}
/* Bảng phút nghe: up = vừa hết giờ (bài đang dừng; đổi xong thì phát tiếp) */
function radioMinutes(up){
  document.querySelectorAll('.modal').forEach(x=>x.remove());
  const m=modalBox(`<h2>${up?'⏰ Hết giờ nghe rồi!':'⏱️ Phút nghe'}</h2>
    <p class="sub">${up?`Mỗi ngày bạn được nghe miễn phí ${LISTEN_FREE_MIN} phút. Mai lại có tiếp nha!`:`Hôm nay còn <b>${mmss(listenLeft())}</b> để nghe (mỗi ngày miễn phí ${LISTEN_FREE_MIN} phút)`}</p>
    <p class="sub">Đổi sao lấy thêm phút · Bạn đang có <b>${balance()} ⭐</b></p>
    <div class="row">${LISTEN_PACKS.map((p,i)=>`<button class="btn ${balance()>=p.price?'p-pink gloss':'p-gray'}" data-i="${i}">+${p.min} phút · ${p.price} ⭐</button>`).join('')}</div>
    <div class="row"><button class="btn p-gray" id="cl">Để sau</button></div>`);
  m.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>radioBuyMinutes(LISTEN_PACKS[+b.dataset.i],m,up));
  $('#cl').onclick=()=>m.remove();
  if(up)rsay('radio_timeup');
}
function radioBuyMinutes(p,m,resume){
  if(balance()<p.price){sfx.bad();rsay('radio_poor',{format:t=>`Cần ${p.price} ⭐ nha! ${t}`});return}
  const d=deviceId(),ls=Object.assign({},S.listenSpent);ls[d]=(ls[d]||0)+p.price;S.listenSpent=ls;
  const l=listenState();l.paid=(l.paid||0)+p.min*60;save();
  sfx.win();confetti(30);m&&m.remove();
  radio(true);
  if(resume&&radioCur)radioPlay();
}

/* ---- Màn hình ---- */
function radioSetTab(c){sfx.click();radioTab=c;radio(true)}
function radioBar(){
  return `<div class="rbar card3d"><div class="rcover" id="rcov">🎶</div>
    <div class="rmid"><div class="rname" id="rname"></div>
      <input type="range" class="rseek" id="rseek" min="0" max="0" step="1" value="0" aria-label="Vị trí nghe">
      <div class="rtime"><span id="rcur">0:00</span><span id="rdur">0:00</span></div></div>
    <div class="rctl"><button class="rbtn" id="rback" aria-label="Lùi 10 giây">⏪</button><button class="rbtn big" id="rplay" aria-label="Phát / tạm dừng">▶️</button><button class="rbtn" id="rfwd" aria-label="Tới 10 giây">⏩</button></div>
    <button class="rleft" id="rleft" title="Phút nghe còn lại hôm nay">⏱️ <b id="rlt">0:00</b> ➕</button></div>`;
}
/* Cập nhật máy phát tại chỗ (không vẽ lại cả màn) */
function radioUI(){
  const it=radioItem(radioCur),on=playing(),cur=it&&radioEl?radioEl.currentTime||0:0,dur=it?radioDur():0;
  const set=(sel,f)=>{const e=$(sel);if(e)f(e)};
  set('#rcov',e=>{e.textContent=it?it.icon:'🎶';e.classList.toggle('spin',on)});
  set('#rname',e=>{e.textContent=it?it.name:'Chọn một bài để nghe nhé!'});
  set('#rseek',e=>{e.max=Math.floor(dur);if(!radioSeeking)e.value=Math.floor(cur);e.disabled=!it});
  set('#rcur',e=>{if(!radioSeeking)e.textContent=mmss(cur)});
  set('#rdur',e=>{e.textContent=mmss(dur)});
  set('#rplay',e=>{e.textContent=on?'⏸️':'▶️';e.disabled=!it});
  set('#rlt',e=>{e.textContent=mmss(listenLeft())});
  set('#rleft',e=>e.classList.toggle('low',listenLeft()<60));
  document.querySelectorAll('.ritem').forEach(b=>{b.classList.toggle('on',b.dataset.id===radioCur);b.classList.toggle('playing',on&&b.dataset.id===radioCur)});
}
/* quiet: vẽ lại (đổi tab, vừa đổi sao) mà Kuromi không chào lại; bài đang phát vẫn phát tiếp */
function radio(quiet){
  const cat=RADIO.find(c=>c.id===radioTab)||RADIO[0];
  const items=RADIO_ITEMS.filter(x=>x.cat===cat.id);
  const tabs=`<div class="atabs">${RADIO.map(c=>`<button class="atab ${c.id===cat.id?'sel':''}" onclick="radioSetTab('${c.id}')">${c.icon} ${esc(c.name)} <i>${RADIO_ITEMS.filter(x=>x.cat===c.id).length}</i></button>`).join('')}</div>`;
  const card=(it,i)=>{const own=hasSong(it.id);
    return `<button class="ritem enter ${own?'':'lockd'}" ${enter(i)} data-id="${esc(it.id)}"><b>${it.icon}</b><span class="rn">${esc(it.name)}</span>
      <i class="rtag ${own?'':'lk'}">${own?(it.price>0?'▶️ Nghe':'🎁 Miễn phí'):`🔒 ${it.price} ⭐`}</i></button>`};
  const list=items.length?`<div class="rgrid">${items.map(card).join('')}</div>`:`<p class="empty">Sắp có ${esc(cat.name.toLowerCase())} mới nha! 🎶</p>`;
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'sm'},cls:'radio',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button>🎵 Tiệm âm thanh<span class="coin">⭐ ${balance()}</span></div>`,
    body:`${tabs}<div class="acard card3d">${list}</div>${radioBar()}`});
  app.querySelectorAll('.ritem').forEach(b=>b.onclick=()=>radioOpen(b.dataset.id));
  $('#rplay').onclick=()=>{if(radioCur)playing()?radioPause():radioPlay()};
  $('#rback').onclick=()=>radioSkip(-10);
  $('#rfwd').onclick=()=>radioSkip(10);
  const sk=$('#rseek');
  sk.oninput=()=>{radioSeeking=true;const c=$('#rcur');if(c)c.textContent=mmss(+sk.value)};
  sk.onchange=()=>{radioSeeking=false;if(radioEl&&radioCur){try{radioEl.currentTime=+sk.value}catch(e){}radioMark()}radioUI()};
  $('#rleft').onclick=()=>{sfx.click();radioMinutes(false)};
  radioUI();
  if(!quiet)rsay('radio_hello');
}
