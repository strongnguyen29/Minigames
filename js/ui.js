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
function levels(g){
  const G=GAMES[g];
  app.innerHTML=topbar('home()')+`<h2>${G.icon} ${G.name}</h2><p class="sub">Chọn mức độ</p>`+
  G.levels.map((n,i)=>{
    const locked=i>0&&(S.best[g+'-'+(i-1)]||0)<2;
    return `<button class="lv ${locked?'lock':''}" onclick="${locked?`sfx.bad();toast('Đạt 2 sao ở mức trước để mở khoá nhé! 🔒')`:`sfx.click();start('${g}',${i})`}"><span>${locked?'🔒':'▶️'} ${n}</span>${starsHTML(S.best[g+'-'+i]||0)}</button>`}).join('')+'<div id="tt"></div>';
}
function toast(t){const e=$('#tt');if(e){e.innerHTML=`<div class="toast enter">${t}</div>`}}

function start(g,l){
  P={g,l,i:0,total:8,mistakes:0,seen:new Set(),locked:false};
  nextQ();
}
function nextQ(){
  if(P.i>=P.total)return finish();
  let q,tries=0;
  do{q=GAMES[P.g].gen(P.l)}while(P.seen.has(q.key)&&tries++<15);
  P.seen.add(q.key);P.q=q;P.wrong=0;P.locked=false;
  const G=GAMES[P.g];
  app.innerHTML=topbar(`P=null;levels('${P.g}')`)+`<div class="bar">${Array.from({length:P.total},(_,i)=>`<i class="${i<P.i?'done':i===P.i?'cur':''}"></i>`).join('')}</div>
  <div class="qcard"><button class="iconbtn speak" onclick="say(P.q.say||P.q.prompt)">🔊</button>
  <div class="prompt">${q.prompt}</div><div class="visual">${q.visual}</div></div>
  <div class="choices">${q.choices.map((c,i)=>`<button class="ch" data-i="${i}">${c.html}</button>`).join('')}</div>`;
  app.querySelectorAll('.ch').forEach(b=>b.onclick=()=>answer(b));
  if(q.say)setTimeout(()=>P&&P.q===q&&say(q.say),300);
}
function answer(btn){
  if(!P||P.locked||btn.classList.contains('bad'))return;
  const c=P.q.choices[+btn.dataset.i];
  if(c.key===P.q.correct){
    P.locked=true;btn.classList.add('good');sfx.ok(P.combo=(P.combo||0)+1);confetti(8);
    P.i++;
    if(P.q.explain){$('.qcard').insertAdjacentHTML('beforeend',`<div class="explain">💡 ${P.q.explain}</div>`);setTimeout(nextQ,2800)}else setTimeout(nextQ,950);
  }else{
    P.mistakes++;P.wrong++;P.combo=0;btn.classList.add('bad');sfx.bad();
    if(P.wrong>=2){app.querySelectorAll('.ch').forEach((b,i)=>{if(P.q.choices[i].key===P.q.correct)b.classList.add('hint')})}
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
