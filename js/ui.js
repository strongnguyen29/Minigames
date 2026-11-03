/* ============ Giao diện ============ */
const app=$('#app');
let P=null; // trạng thái lượt chơi
function starsHTML(n){return `<span class="stars">${[1,2,3].map(i=>`<span class="${i<=n?'':'off'}">⭐</span>`).join('')}</span>`}

/* Mọi lần chuyển màn: dừng giọng, huỷ hẹn giờ cảm xúc của màn cũ */
function go(fn){voice.stop();mascotReset();fn()}
/* Bấm nút điều hướng: nút nảy kiểu thạch rồi mới chuyển màn (chặn bấm đúp) */
let goBusy=false;
function goTap(el,fn){
  if(goBusy)return;goBusy=true;sfx.click();
  el&&el.classList.add('tap');
  setTimeout(()=>{goBusy=false;go(fn)},180);
}
const enter=i=>`style="--d:${(i*.05).toFixed(2)}s"`;

function welcome(){
  let av=S.avatar;
  app.innerHTML=screenHTML({mascot:{emo:'neutral',size:'lg'},cls:'welcome',
    body:`<div class="wel"><h1 class="hero-t">Chào mừng bé!</h1>
    <input class="inp" id="nm" maxlength="14" placeholder="Nhập tên bé" value="${esc(S.name)}">
    <div class="avs2">${AVATARS.map((a,i)=>`<button class="av2 enter ${a===av?'sel':''}" ${enter(i)} data-a="${a}">${a}</button>`).join('')}</div>
    <button class="btn p-pink gloss big-go" id="go">Bắt đầu!</button></div>`});
  mascotSay('welcome_ask');
  app.querySelectorAll('.av2').forEach(b=>b.onclick=()=>{av=b.dataset.a;app.querySelectorAll('.av2').forEach(x=>x.classList.toggle('sel',x===b));sfx.click()});
  $('#go').onclick=()=>{S.name=$('#nm').value.trim()||'Bé';S.avatar=av;save();sfx.ok();voice.line('welcome_done');mascotReset();touchStreak();home()};
}
function settings(){
  sfx.click();
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="box set"><h2>⚙️ Cài đặt</h2>
  <div class="stat"><div><b>${S.rounds}</b>màn đã học</div><div><b>${S.streak} 🔥</b>ngày liên tiếp</div><div><b>${S.perfect}</b>lần không sai</div></div>
  <div class="sw">🗣️ Giọng Kuromi<button class="tg ${S.voice?'':'off'}" id="tv" aria-label="Giọng Kuromi"></button></div>
  <div class="sw">🎵 Âm thanh hiệu ứng<button class="tg ${S.sfx?'':'off'}" id="ts" aria-label="Âm thanh hiệu ứng"></button></div>
  <div class="row"><button class="btn p-purple" id="chg">✏️ Đổi tên / hình</button><button class="btn p-gray small" id="rst">Xoá dữ liệu</button></div>
  <div class="row"><button class="btn p-pink gloss" id="cl">Đóng</button></div>
  <img class="mm" src="${MASCOT_IMG.neutral}" alt="" draggable="false"></div>`;
  document.body.appendChild(m);
  const snd=()=>{const b=$('.top .snd');if(b)b.textContent=S.voice||S.sfx?'🔊':'🔇'};
  $('#tv').onclick=e=>{S.voice=!S.voice;if(!S.voice)voice.stop();e.currentTarget.classList.toggle('off',!S.voice);save();snd()};
  $('#ts').onclick=e=>{S.sfx=!S.sfx;e.currentTarget.classList.toggle('off',!S.sfx);save();sfx.click();snd()};
  $('#cl').onclick=()=>m.remove();
  $('#chg').onclick=()=>{m.remove();go(welcome)};
  $('#rst').onclick=()=>{if(confirm('Xoá hết sao, hình dán và tên của bé?')){try{localStorage.removeItem(KEY)}catch(e){}memFallback=null;S=Object.assign({},DEF,{stickers:[],best:{},badges:[],owned:[]});m.remove();go(welcome)}};
}
/* Trang chủ: 6 trò học + cờ caro, tiệm công chúa, bộ sưu tập */
const HOME_ORDER=['count','shape','add','split','cmp','pattern'];
const HOME_COLORS=['p-purple','p-pink','p-blue'];
function home(){
  const games=HOME_ORDER.filter(k=>GAMES[k]).concat(Object.keys(GAMES).filter(k=>!HOME_ORDER.includes(k)));
  const card=(i,cls,icon,name,sub,act)=>`<button class="gc btn gloss enter ${cls}" ${enter(i)} onclick="goTap(this,${act})"><b>${icon}</b>${name}${sub?`<i>${sub}</i>`:''}</button>`;
  const cards=games.map((k,i)=>{const g=GAMES[k],tot=g.levels.reduce((a,_,j)=>a+(S.best[k+'-'+j]||0),0);
    return card(i,HOME_COLORS[i%3],g.icon,g.name,`⭐ ${tot}/${g.levels.length*3}`,`()=>levels('${k}')`)});
  const n=cards.length;
  cards.push(card(n,'p-dark','⭕','Cờ caro','','caro'),card(n+1,'p-pink','👑','Tiệm công chúa','','shop'),
    card(n+2,'p-purple','🎁','Bộ sưu tập',`${S.stickers.length}/${STICKERS.length}`,'album'));
  app.innerHTML=screenHTML({mascot:{emo:'neutral',size:'lg'},top:topbar(),cls:'home',body:`<div class="hgrid">${cards.join('')}</div>`});
  const fire=S.streak>1?` 🔥 ${S.streak} ngày liên tiếp!`:'';
  mascotSay('home',{format:t=>withName(t)+fire});
}
/* Chọn mức: các mức nằm trên con đường chấm trắng uốn lượn trên mây (toạ độ % trong khung) */
const LEVEL_PATH=[[12,85],[30,55],[60,45],[85,38],[62,14],[34,24]];
function levels(g){
  const G=GAMES[g],best=i=>S.best[g+'-'+i]||0;
  const locked=i=>i>0&&best(i-1)<2;
  const cur=G.levels.findIndex((_,i)=>!locked(i)&&best(i)<2);
  const tot=G.levels.reduce((a,_,i)=>a+best(i),0);
  const node=(n,i,pos)=>{
    const st=locked(i)?'lock':i===cur?'cur':best(i)>=1?'done':'open';
    const stars=[1,2,3].map(k=>`<span class="${k<=best(i)?'':'off'}">⭐</span>`).join('');
    return `<button class="lvn btn gloss enter ${st} ${st==='lock'?'p-gray':st==='cur'?'p-pink':st==='done'?'p-green':'p-blue'}" style="--d:${(i*.08).toFixed(2)}s${pos?`;left:${pos[0]}%;top:${pos[1]}%`:''}" data-i="${i}">
      ${st==='lock'?'🔒':i+1}${st==='lock'?'':`<small>${stars}</small>`}<span class="nm">${esc(n)}</span></button>${i===cur&&pos?`<span class="flag" style="left:calc(${pos[0]}% + var(--u)*3);top:calc(${pos[1]}% - var(--u)*12)">🚩</span>`:''}`;
  };
  const onPath=G.levels.slice(0,LEVEL_PATH.length),extra=G.levels.slice(LEVEL_PATH.length);
  const d='M'+LEVEL_PATH.slice(0,onPath.length).map(([x,y])=>`${x} ${y}`).join(' L ');
  app.innerHTML=screenHTML({mascot:{emo:'neutral',size:'lg'},cls:'levels',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button>${G.icon} ${esc(G.name)}<span class="coin">⭐ ${tot}/${G.levels.length*3}</span></div>`,
    body:`<div class="path"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 6" vector-effect="non-scaling-stroke" opacity=".9"/></svg>
      ${onPath.map((n,i)=>node(n,i,LEVEL_PATH[i])).join('')}</div>
      ${extra.length?`<div class="row lvx">${extra.map((n,j)=>node(n,j+LEVEL_PATH.length)).join('')}</div>`:''}`});
  app.querySelectorAll('.lvn').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    if(locked(i)){sfx.bad();b.classList.remove('shk');void b.offsetWidth;b.classList.add('shk');mascotSay('locked');return}
    goTap(b,()=>start(g,i));
  });
  mascotSay('levels_'+g);
}
function toast(t){const e=$('#tt');if(e){e.innerHTML=`<div class="toast enter">${t}</div>`}}

function start(g,l){
  P={g,l,i:0,total:8,mistakes:0,seen:new Set(),locked:false,token:0};
  nextQ(true);
}
/* P.token tăng mỗi câu: mọi việc chạy sau await phải còn đúng lượt chơi (P===R) và đúng câu (token) */
const alive=(R,my)=>P===R&&R.token===my;
async function nextQ(first){
  if(!P)return;
  if(P.i>=P.total)return finish();
  let q,tries=0;
  do{q=GAMES[P.g].gen(P.l)}while(P.seen.has(q.key)&&tries++<15);
  P.seen.add(q.key);P.q=q;P.wrong=0;P.locked=false;
  const R=P,my=++P.token;
  app.innerHTML=screenHTML({mascot:{emo:'neutral',size:'md'},cls:'play',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,()=>{const g=P&&P.g;P=null;levels(g)})">⬅️</button>
      <div class="prog">${Array.from({length:P.total},(_,i)=>`<i class="${i<P.i?'d':i===P.i?'cur':''}"></i>`).join('')}</div></div>`,
    body:`<div class="qc card3d"><button class="spk" onclick="say(P.q.say||P.q.prompt)">🔊</button>
      <div class="prompt">${q.prompt}</div><div class="visual">${q.visual}</div></div>
      <div class="chs n${q.choices.length}">${q.choices.map((c,i)=>`<button class="ch enter" style="--d:${(i*.05).toFixed(2)}s" data-i="${i}">${c.html}</button>`).join('')}</div>`});
  app.querySelectorAll('.ch').forEach(b=>b.onclick=()=>answer(b));
  if(first){await voiceWait(mascotSay('round_start'),0,3000);if(!alive(R,my))return}
  else{await new Promise(r=>setTimeout(r,300));if(!alive(R,my))return}
  say(q.say||q.prompt);
}
async function answer(btn){
  if(!P||P.locked||btn.classList.contains('bad'))return;
  voice.stop();
  const R=P,my=P.token,q=P.q,c=q.choices[+btn.dataset.i];
  if(c.key===q.correct){
    P.locked=true;btn.classList.add('good');sfx.ok(P.combo=(P.combo||0)+1);confetti(8);
    P.i++;
    let chain=mascotSay(P.combo>=3?'combo':'correct');
    const img=$('#mimg');burst(img&&img.parentNode,8);
    if(q.explain){
      const qc=$('.qc');qc&&qc.insertAdjacentHTML('beforeend',`<div class="explain enter">💡 ${q.explain}</div>`);
      chain=chain.then(()=>alive(R,my)?voice.text(q.explain):null);
    }
    await voiceWait(chain,950,q.explain?6000:3000);
    if(alive(R,my))nextQ();
  }else{
    P.mistakes++;P.wrong++;P.combo=0;btn.classList.add('bad');sfx.bad();
    if(P.wrong>=2){
      app.querySelectorAll('.ch').forEach((b,i)=>{if(q.choices[i].key===q.correct)b.classList.add('hint')});
      mascotSay('hint');
    }else mascotSay('wrong');
  }
}
function finish(){
  const m=P.mistakes,stars=m<=1?3:m<=3?2:1,k=P.g+'-'+P.l,g=P.g,l=P.l;
  touchStreak();
  S.best[k]=Math.max(S.best[k]||0,stars);
  S.stars+=stars;S.rounds++;
  if(m===0)S.perfect++;
  let gift=false;if(stars>=2){S.gifts++;gift=true}
  const newB=checkBadges();save();P=null;
  sfx.win();confetti(40);
  const msg=stars===3?'Giỏi quá! Tuyệt vời! 🎉':stars===2?'Giỏi lắm! Cố lên nào! 👏':'Bé đã cố gắng rồi! Thử lại nhé 💪';
  const nextOk=l<GAMES[g].levels.length-1&&(S.best[g+'-'+l]||0)>=2;
  app.innerHTML=topbar()+`<div class="result panel"><h1>${msg}</h1>${starsHTML(stars)}
  <p class="sub">Bé nhận được +${stars} ⭐${gift?' và 1 hộp quà 🎁':''}</p>
  ${newB.map(b=>`<div class="toast">${b.icon} Huy hiệu mới: <b>${b.name}</b></div>`).join('')}
  <div class="row">${gift?`<button class="btn" onclick="openGift(()=>result_btns())">🎁 Mở quà</button>`:''}
  <button class="btn alt" onclick="start('${g}',${l})">🔁 Chơi lại</button>
  ${nextOk?`<button class="btn" style="background:#66bb6a;box-shadow:0 5px 0 #3d8b40" onclick="start('${g}',${l+1})">➡️ Mức tiếp theo</button>`:''}
  <button class="btn gray" onclick="home()">🏠 Về nhà</button></div></div>`;
  window.result_btns=()=>{const b=document.querySelector('.result .row .btn');if(b&&b.textContent.includes('Mở quà')){if(S.gifts<1)b.remove()}};
}
function openGift(done){
  if(S.gifts<1)return;
  sfx.click();
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="box"><h2>Chạm vào hộp quà!</h2><div class="gift" id="gb">🎁</div></div>`;
  document.body.appendChild(m);
  $('#gb').onclick=()=>{
    const left=STICKERS.filter(s=>!S.stickers.includes(s));
    let html;
    S.gifts--;
    if(left.length){const s=pick(left);S.stickers.push(s);html=`<div class="pop">${s}</div><h2>Hình dán mới!</h2>`}
    else{S.stars+=3;html=`<div class="pop">🌟</div><h2>Bé đã có tất cả hình dán! +3 ⭐</h2>`}
    const gained=checkBadges();save();sfx.win();confetti(40);
    m.querySelector('.box').innerHTML=html+gained.map(b=>`<div class="toast">${b.icon} Huy hiệu: ${b.name}</div>`).join('')+
      `<div class="row">${S.gifts>0?`<button class="btn" id="again">🎁 Mở tiếp (${S.gifts})</button>`:''}<button class="btn alt" id="ok">Tuyệt!</button></div>`;
    $('#ok').onclick=()=>{m.remove();done&&done();if(!done)album()};
    const ag=$('#again');if(ag)ag.onclick=()=>{m.remove();openGift(done)};
  };
}
function album(){
  app.innerHTML=topbar('home()')+`<h2>🎁 Bộ sưu tập của ${esc(S.name||'bé')}</h2>
  <div class="panel" style="text-align:center">${S.gifts>0?`<p class="sub">Bé có ${S.gifts} hộp quà chưa mở!</p><button class="btn" onclick="openGift()">🎁 Mở quà</button>`:`<p class="sub" style="margin:0">Đạt từ 2 ⭐ trở lên để nhận hộp quà mới nhé!</p>`}</div>
  <div class="panel"><h3 style="margin-top:0">Bộ sưu tập hình dán (${S.stickers.length}/${STICKERS.length})</h3>
  <div class="album">${STICKERS.map(s=>S.stickers.includes(s)?`<div class="stk">${s}</div>`:`<div class="stk lock">❓</div>`).join('')}</div></div>
  ${wardrobe()}
  <div class="panel"><h3 style="margin-top:0">Huy hiệu (${S.badges.length}/${BADGES.length})</h3><div class="badges">${BADGES.map(b=>`<div class="bdg ${S.badges.includes(b.id)?'':'lock'}"><span>${b.icon}</span><div>${b.name}<small>${b.desc}</small></div></div>`).join('')}</div></div>`;
}
