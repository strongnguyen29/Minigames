/* ============ Giao diện ============ */
const app=$('#app');
let P=null; // trạng thái lượt chơi

/* Mọi lần chuyển màn: dừng giọng, dừng bài đang nghe ở Tiệm âm thanh, khoá chế độ bố mẹ, huỷ hẹn giờ cảm xúc của màn cũ */
function go(fn){voice.stop();if(typeof radioStop==='function')radioStop();if(typeof chatCancel==='function')chatCancel();if(typeof parentLock==='function')parentLock();mascotReset();fn()}
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
  /* lối lấy lại tiến độ: chỉ cho máy chưa có tên và chưa đăng nhập (không hiện khi vào từ Đổi tên / hình) */
  const cget=cloud.available&&!S.name&&!cloud.state().signedIn;
  app.innerHTML=screenHTML({mascot:{emo:'neutral',size:'lg'},cls:'welcome',
    body:`<div class="wel"><h1 class="hero-t">Chào mừng bạn!</h1>
    <input class="inp" id="nm" maxlength="14" placeholder="Nhập tên của bạn" value="${esc(S.name)}">
    <div class="avs2">${AVATARS.map((a,i)=>`<button class="av2 enter ${a===av?'sel':''}" ${enter(i)} data-a="${a}">${a}</button>`).join('')}</div>
    <button class="btn p-pink gloss big-go" id="go">Bắt đầu!</button>
    ${cget?'<button class="btn p-gray small" id="cget">Đã có tiến độ? Đăng nhập để lấy lại</button>':''}</div>`});
  if(cget){cloud.prepare();$('#cget').onclick=()=>{sfx.click();cloud.signIn()}}
  mascotSay('welcome_ask',{ifIdle:true});
  app.querySelectorAll('.av2').forEach(b=>b.onclick=()=>{av=b.dataset.a;app.querySelectorAll('.av2').forEach(x=>x.classList.toggle('sel',x===b));sfx.click()});
  $('#go').onclick=()=>{S.name=$('#nm').value.trim()||'Bạn';S.avatar=av;S.profileUpdatedAt=Date.now();save();sfx.ok();voice.line('welcome_done');mascotReset();touchStreak();home()};
}
const RESET_CLOUD_MSG='Xoá tiến độ trên máy này? (Bản sao lưu trên mây vẫn còn)';
const RESET_UNSYNCED_MSG='Chưa sao lưu được tiến độ mới nhất. Vẫn xoá? (Phần chưa sao lưu sẽ mất)';
let setM=null; // hộp Cài đặt đang mở (để vẽ lại khối Sao lưu khi trạng thái đổi)
const hhmm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function cloudDraw(){
  const box=$('#cloud');if(!box)return;
  if(!cloud.available){box.innerHTML='';box.style.display='none';return}
  const c=cloud.state();
  box.style.display='';
  box.innerHTML=`<div class="ct">☁️ Sao lưu</div>`+(c.signedIn
    ?`<div class="cmail">${esc(c.email)}</div>
      ${c.error?'<div class="cst bad">Chưa sao lưu được, sẽ thử lại khi có mạng</div>':c.lastSync?`<div class="cst">Đã sao lưu lúc ${hhmm(c.lastSync)}</div>`:''}
      <div class="row"><button class="btn p-blue small" id="csy">Đồng bộ ngay</button><button class="btn p-gray small" id="cout">Đăng xuất</button></div>`
    :`<button class="btn p-blue small" id="cin">Đăng nhập Google để sao lưu</button><div class="cst">Giữ sao và quà của bé, chơi tiếp trên máy khác</div>`);
  const on=(id,fn)=>{const b=$(id);if(b)b.onclick=fn};
  on('#cin',()=>{sfx.click();cloud.signIn().then(cloudDraw)});
  on('#csy',()=>{sfx.click();cloud.pull().then(cloudDraw)});
  on('#cout',()=>{sfx.click();cloud.signOut().then(cloudDraw);cloudDraw()});
  if(!c.signedIn)cloud.prepare();
}
cloud.onChange=hadName=>{
  if(!hadName&&S.name){touchStreak();go(home)}
  else if(app.querySelector('.hgrid'))go(home);
  if(setM&&setM.isConnected)cloudDraw();
};
function settings(){
  sfx.click();
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="box set"><h2>⚙️ Cài đặt</h2>
  <div class="stat"><div><b>${S.rounds}</b>màn đã học</div><div><b>${S.streak} 🔥</b>ngày liên tiếp</div><div><b>${S.perfect}</b>lần không sai</div></div>
  <div class="sw">🗣️ Giọng Kuromi<button class="tg ${S.voice?'':'off'}" id="tv" aria-label="Giọng Kuromi"></button></div>
  <div class="sw">🎵 Âm thanh hiệu ứng<button class="tg ${S.sfx?'':'off'}" id="ts" aria-label="Âm thanh hiệu ứng"></button></div>
  <div class="sw">🎶 Nhạc nền<button class="tg ${S.music?'':'off'}" id="tm" aria-label="Nhạc nền"></button></div>
  <div class="sw">🔑 Khoá Gemini<button class="btn p-blue small" id="gkey">${geminiKey()?'Đổi':'Nhập'}</button></div>
  <div class="sw">💬 Còn ${talkLeft()} câu hôm nay<button class="btn p-blue small" id="gbuy">Đổi sao</button></div>
  <div class="cloudbox" id="cloud"></div>
  <div class="row"><button class="btn p-purple" id="chg">✏️ Đổi tên / hình</button><button class="btn p-gray small" id="rst">Xoá dữ liệu</button></div>
  <div class="row"><button class="btn p-pink gloss" id="cl">Đóng</button></div>
  <img class="mm" src="${MASCOT_IMG.neutral}" alt="" draggable="false"></div>`;
  document.body.appendChild(m);
  setM=m;cloudDraw();
  const snd=()=>{const b=$('.top .snd');if(b)b.textContent=anySound()?'🔊':'🔇'};
  $('#tv').onclick=e=>{S.voice=!S.voice;if(!S.voice)voice.stop();e.currentTarget.classList.toggle('off',!S.voice);save();snd()};
  $('#ts').onclick=e=>{S.sfx=!S.sfx;e.currentTarget.classList.toggle('off',!S.sfx);save();sfx.click();snd()};
  $('#tm').onclick=e=>{S.music=!S.music;e.currentTarget.classList.toggle('off',!S.music);save();music.sync();snd()};
  $('#cl').onclick=()=>m.remove();
  const gk=$('#gkey'),gb=$('#gbuy');
  if(gk)gk.onclick=()=>{m.remove();chatKeyModal()};
  if(gb)gb.onclick=()=>{m.remove();chatBuyModal()};
  $('#chg').onclick=()=>{m.remove();go(welcome)};
  $('#rst').onclick=async()=>{const inn=cloud.state().signedIn;
    if(!confirm(inn?RESET_CLOUD_MSG:'Xoá hết sao, hình dán và tên của bé?'))return;
    /* đang đăng nhập: đẩy phần chưa sao lưu lên trước; đẩy không được thì hỏi lại */
    if(inn){if(!(await cloud.flushNow())&&!confirm(RESET_UNSYNCED_MSG))return;cloud.signOut()}
    cloud.forget();try{localStorage.removeItem(KEY)}catch(e){}newDevice();memFallback=null;S=freshSave();m.remove();go(welcome)};
}
/* Trang chủ: 6 trò học + cờ caro, Công chúa chăm ngoan, tiệm công chúa, tiệm âm thanh, bộ sưu tập */
const HOME_ORDER=['count','shape','add','split','cmp','pattern'];
const HOME_COLORS=['p-purple','p-pink','p-blue'];
function home(){
  const games=HOME_ORDER.filter(k=>GAMES[k]).concat(Object.keys(GAMES).filter(k=>!HOME_ORDER.includes(k)));
  const card=(i,cls,icon,name,sub,act)=>`<button class="gc btn gloss enter ${cls}" ${enter(i)} onclick="goTap(this,${act})"><b>${icon}</b>${name}${sub?`<i>${sub}</i>`:''}</button>`;
  const cards=games.map((k,i)=>{const g=GAMES[k],tot=g.levels.reduce((a,_,j)=>a+(S.best[k+'-'+j]||0),0);
    return card(i,HOME_COLORS[i%3],g.icon,g.name,`⭐ ${tot}/${g.levels.length*3}`,`()=>levels('${k}')`)});
  const n=cards.length;
  /* thẻ Công chúa chăm ngoan: dòng phụ là số việc đang chờ bố mẹ chấm */
  const wait=typeof chorePending==='function'?chorePending().length:0;
  cards.push(card(n,'p-dark','⭕','Cờ caro','','caro'));
  if(typeof chores==='function')cards.push(card(n+1,'p-pink','👸','Công chúa chăm ngoan',wait>0?`⏳ ${wait}`:'','chores'));
  cards.push(card(n+2,'p-pink','👑','Tiệm công chúa','','shop'),card(n+3,'p-blue','🎵','Tiệm âm thanh','','radio'),
    card(n+4,'p-purple','🎁','Bộ sưu tập',`${S.stickers.length}/${STICKERS.length}`,'album'));
  app.innerHTML=screenHTML({mascot:{emo:'neutral',size:'lg',extra:chatMicOK()?chatBtnHTML():''},top:topbar(),cls:'home',body:`<div class="hgrid">${cards.join('')}</div>`});
  const fire=S.streak>1?` 🔥 ${S.streak} ngày liên tiếp!`:'';
  if(chatHintDue())mascotSay('talk_hint',{ifIdle:true});
  else mascotSay('home',{format:t=>withName(t)+fire,ifIdle:true});
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
    top:`<div class="ttl"><button class="back" onclick="goTap(this,()=>{P=null;levels('${P.g}')})">⬅️</button>
      <div class="prog">${Array.from({length:P.total},(_,i)=>`<i class="${i<P.i?'d':i===P.i?'cur':''}"></i>`).join('')}</div></div>`,
    body:`<div class="qc card3d"><button class="spk" onclick="say(P.q.say||P.q.prompt)">🔊</button>
      <div class="prompt">${q.prompt}</div><div class="visual">${q.visual}</div></div>
      <div class="chs n${q.choices.length}">${q.choices.map((c,i)=>`<button class="ch enter" style="--d:${(i*.05).toFixed(2)}s" data-i="${i}">${c.html}</button>`).join('')}</div>`});
  app.querySelectorAll('.ch').forEach(b=>b.onclick=()=>answer(b));
  /* bé đã bấm đáp án trong lúc Kuromi nói câu mở màn thì không đọc đề nữa */
  if(first){await voiceWait(mascotSay('round_start'),0,3000);if(!alive(R,my)||R.locked||R.wrong)return}
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
      chain=chain.then(ok=>ok&&alive(R,my)?voice.text(q.explain):null);
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
  const first3=stars===3&&(S.best[k]||0)<3;
  S.best[k]=Math.max(S.best[k]||0,stars);
  S.stars+=stars;S.rounds++;
  if(m===0)S.perfect++;
  let gift=false;if(stars>=2){S.gifts++;gift=true}
  if(first3)S.luckyGifts=[...(S.luckyGifts||[]),l]; // quà lần đầu 3 sao: có cơ hội ra váy, nhớ màn để tính tỷ lệ
  const newB=checkBadges();save();P=null;
  sfx.win();
  const msg=stars===3?'Giỏi quá! Tuyệt vời! 🎉':stars===2?'Giỏi lắm! 👏':'Bạn đã cố gắng rồi! 💪';
  const nextOk=l<GAMES[g].levels.length-1&&(S.best[g+'-'+l]||0)>=2;
  const emo=stars>=2?'clap':'think';
  app.innerHTML=screenHTML({mascot:{emo,size:'lg'},cls:'result',
    body:`<div class="res card3d">${stars>=2?'<div class="rays"></div>':''}<h1>${msg}</h1>
    <div class="bigst">${[1,2,3].map(i=>`<span class="${i<=stars?'on':'off'}">⭐</span>`).join('')}</div>
    <div class="gain"><b>+${stars} ⭐</b>${gift?'<b>+1 🎁</b>':''}</div>
    ${newB.length?`<div class="newb">${newB.map((b,i)=>`<div class="badge${newB.length>1?' sm':''}" style="--d:${(2.4+i*.2).toFixed(1)}s"><span>${b.icon}</span>${newB.length>1?'':'Huy hiệu mới: '}${esc(b.name)}!</div>`).join('')}</div>`:''}
    <div class="row" id="rbtn">${gift?`<button class="btn p-pink gloss" id="rgift" onclick="openGift(()=>result_btns())">🎁 Mở quà</button>`:''}
    <button class="btn p-blue" onclick="goTap(this,()=>start('${g}',${l}))">🔁 Chơi lại</button>
    ${nextOk?`<button class="btn p-green" onclick="goTap(this,()=>start('${g}',${l+1}))">➡️ Mức tiếp</button>`:''}
    <button class="btn p-white" onclick="goTap(this,home)" aria-label="Về nhà">🏠</button></div></div>`});
  [400,900,1400].slice(0,stars).forEach(t=>setTimeout(()=>sfx.click(),t));
  if(stars>=2)setTimeout(()=>confetti(30),1500);
  /* câu huy hiệu chỉ phát khi câu kết quả nói xong (không phát nếu bé đã mở quà / chuyển màn) */
  mascotSay('result'+stars,{hold:true}).then(ok=>{if(ok&&newB.length)mascotSay('badge',{hold:true})});
  window.result_btns=()=>{const b=$('#rgift');if(b&&S.gifts<1)b.remove()};
}
const dressChance=l=>Math.min(1,.3+.1*l); // l: chỉ số màn (0 = màn 1)
/* Lớp phủ mở quà: tím mờ, hộp quà lắc lư, Kuromi nhảy bên cạnh; chạm hộp thì take() trả quà {pic,title,line} bung ra.
   count: số hộp còn (để hiện "Mở tiếp"); done: bấm "Tuyệt!" */
function giftOverlay(o){
  if(o.count()<1)return;
  sfx.click();
  const m=document.createElement('div');m.className='modal gift-ov';
  m.innerHTML=`<div class="gbox"><img class="gmas" src="${MASCOT_IMG.happy}" alt="" draggable="false">
    <div class="gb" id="gb">🎁</div><div class="gtxt">Chạm vào hộp quà nào!</div></div>`;
  document.body.appendChild(m);
  voice.line('gift_open');
  let opened=false;
  $('#gb').onclick=()=>{
    if(opened)return;opened=true;
    const {pic,title,line}=o.take();
    const gained=checkBadges();save();sfx.win();confetti(40);
    voice.line(line);
    const n=o.count();
    m.querySelector('.gbox').innerHTML=`<img class="gmas" src="${MASCOT_IMG.happy}" alt="" draggable="false"><div class="halo"></div>
      <div class="stk-big">${pic}</div><div class="gtxt">${title}</div>
      ${gained.map(b=>`<div class="badge" style="--d:.6s"><span>${b.icon}</span>Huy hiệu mới: ${esc(b.name)}!</div>`).join('')}
      <div class="row">${n>0?`<button class="btn p-pink gloss" id="again">🎁 Mở tiếp (${n})</button>`:''}<button class="btn p-green" id="ok">Tuyệt!</button></div>`;
    $('#ok').onclick=()=>{m.remove();o.done()};
    const ag=$('#again');if(ag)ag.onclick=()=>{m.remove();giftOverlay(o)};
  };
}
/* Mở quà sau màn chơi (S.gifts): hình dán, hoặc váy với hộp lần đầu 3 sao */
function openGift(done){
  giftOverlay({count:()=>S.gifts,done:()=>done?done():go(album),take(){
    const left=STICKERS.filter(s=>!S.stickers.includes(s));
    let pic,title,line;
    S.gifts--;
    /* hộp quà lần đầu 3 sao (mở trước): màn 1 có 30% ra một váy chưa có, mỗi màn sau +10%; trượt thì như quà thường */
    const lv=(S.luckyGifts||[]).length?S.luckyGifts.shift():-1;
    const dresses=SHOP_ITEMS.filter(x=>!owns(x.id));
    const dress=lv>=0&&dresses.length&&Math.random()<dressChance(lv)?pick(dresses):null;
    if(dress){S.owned=[...(S.owned||[]),dress.id];S.giftOwned=[...(S.giftOwned||[]),dress.id];
      pic=`<img class="gdress" src="${dress.thumb}" alt="${esc(dress.name)}" draggable="false">`;title=`Váy mới: ${esc(dress.name)}!`;line='gift_dress'}
    else if(left.length){pic=pick(left);S.stickers.push(pic);title='Hình dán mới!';line='sticker_new'}
    else{S.stars+=3;pic='🌟';title='Bạn đã có tất cả hình dán! +3 ⭐';line='sticker_all'}
    return {pic,title,line};
  }});
}
/* Bộ sưu tập: dải hộp quà + 3 tab (hình dán / tủ váy / huy hiệu); tab đang chọn được nhớ */
let albumTab='stickers';
function album(tab){
  if(tab)albumTab=tab;
  const mineN=SHOP_ITEMS.filter(x=>owns(x.id)).length;
  const tabs=[['stickers','🐶 Hình dán',`${S.stickers.length}/${STICKERS.length}`],['wardrobe','👗 Tủ váy',`${mineN}/${SHOP_ITEMS.length}`],['badges','🏅 Huy hiệu',`${S.badges.length}/${BADGES.length}`]];
  const body=albumTab==='stickers'?`<div class="stks">${STICKERS.map((s,i)=>S.stickers.includes(s)?`<div class="stk enter" style="--d:${(i*.015).toFixed(3)}s">${s}</div>`:`<div class="stk lk">❓</div>`).join('')}</div>`
    :albumTab==='wardrobe'?wardrobe()
    :`<div class="bdgs">${BADGES.map((b,i)=>`<div class="bdg enter ${S.badges.includes(b.id)?'':'lk'}" style="--d:${(i*.03).toFixed(2)}s"><span>${b.icon}</span><div>${esc(b.name)}<small>${esc(b.desc)}</small></div></div>`).join('')}</div>`;
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'md'},cls:'album',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button>🎁 Bộ sưu tập của ${esc(S.name||'bạn')}<span class="coin">⭐ ${balance()}</span></div>`,
    body:`<div class="giftbar">${S.gifts>0?`<span><b>🎁</b> Bạn có ${S.gifts} hộp quà chưa mở!</span><button class="btn p-pink gloss" onclick="openGift()">Mở quà</button>`:`<span>Đạt từ 2 ⭐ trở lên để nhận hộp quà mới nhé! Lần đầu 3 ⭐ mỗi màn còn có cơ hội nhận váy 👗</span>`}</div>
    <div class="atabs">${tabs.map(([k,n,c])=>`<button class="atab ${k===albumTab?'sel':''}" onclick="sfx.click();voice.stop();album('${k}')">${n} <i>${c}</i></button>`).join('')}</div>
    <div class="acard card3d">${body}</div>`});
  const say={stickers:`Bạn có ${S.stickers.length} hình dán rồi!`,wardrobe:`Bạn có ${mineN} bộ váy xinh!`,badges:`Bạn có ${S.badges.length} huy hiệu rồi!`}[albumTab];
  mascotSay('album_'+albumTab,{emo:'happy',hold:true,format:t=>say+' '+t});
}
