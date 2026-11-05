/* ============ Màn Công chúa chăm ngoan: ba thẻ, màn chấm sao, câu khoá của bố mẹ, hộp quà ============ */
let choreTab='day';
const CHORE_TABS=[['day','☀️ Hôm nay'],['week','📅 Tuần này'],['extra','🌟 Đột xuất']];
const CHORE_EXTRA_BTN={diem10:'💯 Con đạt điểm 10!',vuot_thi:'🎓 Con vượt qua kỳ thi!'};
const choreTask=id=>[...CHORES,...CHORES_WEEK,...CHORES_EXTRA].find(c=>c.id===id);
const choreTaskOf=ref=>{const x=choreExtraOf(ref);return choreTask(x?x.task:ref.split('@')[0])};
/* "2026-11-5" → "5/11" */
const choreDM=p=>{const [,m,d]=p.split('-');return d+'/'+m};
/* chế độ bố mẹ: mỗi lần chạm màn hình thì tính lại 5 phút (chỉ khi đang mở) */
document.addEventListener('pointerdown',()=>parentTouch(),true);

/* một dòng việc: e = mục log hoặc mục đột xuất; sub = dòng nhỏ dưới tên (ngày của việc cũ) */
function choreRow(t,ref,e,sub=''){
  const st=!e||e.st==='redo'?'todo':e.st;if(st==='closed'||!t)return '';
  const tag=st==='todo'?`<button class="btn p-pink gloss ctag" onclick="choreDone('${ref}')">Con xong rồi!</button>`
    :st==='wait'?`<button class="ctag wait" onclick="choreRateModal('${ref}')">⏳ Chờ bố mẹ</button>`
    :`<span class="ctag done">${'⭐'.repeat(e.n||0)}</span>`;
  return `<div class="crow ${st}"><b>${t.icon}</b><span class="cn">${esc(t.name)}${sub?`<small>${sub}</small>`:''}</span>${tag}</div>`;
}
const choreGrp=(title,rows)=>rows.join('')?`<div class="cgrp">${title}</div>${rows.join('')}`:'';
/* nhóm "Còn chờ từ trước": việc kỳ cũ của thẻ này đang chờ chấm */
function chorePastHTML(week){
  const rows=chorePending().filter(p=>p.past&&choreIsWeek(p.task)===week)
    .map(p=>choreRow(choreTask(p.task),p.ref,choreLog()[p.ref],(week?'Tuần từ ':'Ngày ')+choreDM(p.period)));
  return choreGrp('⏳ Còn chờ từ trước',rows);
}
function choreBody(){
  if(choreTab==='week'){
    const w=choreWeek(),n=choreBoxes();
    return `${chorePastHTML(true)}<div class="cnote">🎁 Việc tuần được 5 sao = 1 hộp quà
      ${n>0?`<button class="btn p-pink gloss" onclick="openChoreBox()">🎁 Mở quà (${n})</button>`:''}</div>
      ${choreGrp('📅 Việc tuần này',CHORES_WEEK.map(c=>choreRow(c,choreKey(c.id,w),choreLog()[choreKey(c.id,w)])))}`;
  }
  if(choreTab==='extra'){
    const list=S.chore.extra.filter(x=>x.st==='wait'||x.st==='done').sort((a,b)=>b.t-a.t)
      .map(x=>choreRow(choreTask(x.task),x.id,x,choreDM(dayStr(new Date(x.t)))));
    return `<div class="cxbtns">${CHORES_EXTRA.map(c=>`<button class="btn p-purple gloss" onclick="choreExtraTap('${c.id}')">${CHORE_EXTRA_BTN[c.id]||c.icon+' '+esc(c.name)}</button>`).join('')}</div>
      ${choreGrp('📝 Bé đã báo',list)||'<p class="empty">Khi được điểm 10 hay vượt qua kỳ thi, bé bấm nút ở trên để báo bố mẹ nha!</p>'}`;
  }
  const d=choreDay(),today=choresFor();
  return chorePastHTML(false)+CHORE_GROUPS.map(g=>choreGrp(`${g.icon} ${g.name}`,
    today.filter(c=>c.grp===g.id).map(c=>choreRow(c,choreKey(c.id,d),choreLog()[choreKey(c.id,d)])))).join('');
}
/* quiet: vẽ lại (đổi thẻ, vừa báo/chấm) mà không chào lại */
function chores(quiet){
  /* huy hiệu chuỗi ngày tính từ log: xét trước khi dọn log */
  if(!quiet){checkBadges();chorePrune()}
  const wait=k=>chorePending().filter(p=>k==='extra'?!p.period:p.period&&choreIsWeek(p.task)===(k==='week')).length;
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'sm'},cls:'chores',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button><span class="ctn">👸 Công chúa chăm ngoan</span><span class="coin">⭐ ${balance()}</span>
      ${parentOn()?'<button class="back plock" onclick="sfx.click();parentLock();chores(true)" aria-label="Khoá chế độ bố mẹ" title="Đang mở chế độ bố mẹ, bấm để khoá">🔓</button>':''}</div>`,
    body:`<div class="atabs">${CHORE_TABS.map(([k,n])=>{const c=wait(k);return `<button class="atab ${k===choreTab?'sel':''}" onclick="choreSetTab('${k}')">${n}${c?` <i>⏳${c}</i>`:''}</button>`}).join('')}</div>
      <div class="acard card3d chlist">${choreBody()}</div><div id="tt"></div>`});
  if(!quiet)mascotSay('chore_home',{ifIdle:true});
}
function choreSetTab(k){sfx.click();voice.stop();choreTab=k;chores(true);if(k==='week'&&choreBoxes()>0)mascotSay('chore_box')}
function choreDone(ref){
  const [id,p]=ref.split('@');
  if(!choreReport(id,p))return;
  sfx.ok();chores(true);mascotSay('chore_done');
}
function choreExtraTap(task){
  if(!choreReportExtra(task))return;
  sfx.ok();chores(true);mascotSay('chore_done');
}
/* Màn chấm: chọn 1–5 sao rồi "Chấm N sao"; "Chưa được" không cần câu khoá */
function choreRateModal(ref){
  const t=choreTaskOf(ref);if(!t)return;
  sfx.click();
  let n=0;
  const m=modalBox(`<h2>${t.icon} ${esc(t.name)}</h2><p class="sub">Bố mẹ chấm cho con mấy sao?</p>
    <div class="rstars">${[1,2,3,4,5].map(i=>`<button class="rst off" data-n="${i}" aria-label="${i} sao">⭐</button>`).join('')}</div>
    <button class="btn p-pink gloss" id="rok" disabled>Chấm sao</button>
    <button class="btn p-white" id="rredo">↩︎ Chưa được, con làm lại nhé</button>`);
  m.querySelectorAll('.rst').forEach(b=>b.onclick=()=>{sfx.click();n=+b.dataset.n;
    m.querySelectorAll('.rst').forEach(x=>x.classList.toggle('off',+x.dataset.n>n));
    const ok=$('#rok');ok.disabled=false;ok.textContent=`Chấm ${n} sao`});
  $('#rok').onclick=()=>{if(!n)return;m.remove();choreSubmit(ref,n)};
  $('#rredo').onclick=()=>{m.remove();choreRedoTap(ref)};
}
function choreRedoTap(ref){choreRedo(ref);sfx.click();chores(true);mascotSay('chore_redo')}
/* Chế độ bố mẹ đang mở thì ghi nhận ngay, chưa mở thì hỏi câu khoá trước */
function choreSubmit(ref,n){
  if(parentOn()){parentTouch();return choreRated(ref,n)}
  choreLockModal(()=>{parentOpen();choreRated(ref,n)});
}
function choreRated(ref,n){
  const r=choreRate(ref,n);if(!r)return null;
  const gained=checkBadges();save();
  sfx.win();confetti(30);chores(true);
  const tt=$('#tt');
  if(tt)tt.innerHTML=`<div class="toast enter">+${n} ⭐${r.box?' · +1 🎁':''}</div>`+
    gained.map(b=>`<div class="badge" style="--d:.3s"><span>${b.icon}</span>Huy hiệu mới: ${esc(b.name)}!</div>`).join('');
  if(tt)setTimeout(()=>{if(tt.isConnected)tt.innerHTML=''},gained.length?5000:3000);
  mascotSay('chore_rated',{hold:true}).then(ok=>{if(ok&&gained.length)mascotSay('badge',{hold:true})});
  return r;
}
/* Câu hỏi của bố mẹ: ô đáp án chỉ hiển thị (không bật bàn phím máy), bàn phím số tối đa 4 chữ số; ✓ khi chưa nhập thì bỏ qua; sai thì chờ 2 giây mới bấm ✓ được */
let lockS=null;const LOCK_WRONG_COOLDOWN_MS=2000;
const CHORE_KEYS=['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
function choreLockModal(onOk){
  const q=lockQuestion();
  const m=modalBox(`<h2>🔒 Câu hỏi của bố mẹ</h2><div class="lq" id="lq">${q.text} = ?</div><div class="lans" id="lans">&nbsp;</div>
    <div class="lkeys">${CHORE_KEYS.map(k=>`<button class="lkey${k==='✓'?' ok':''}" onclick="choreLockPress('${k}')">${k}</button>`).join('')}</div>
    <button class="btn p-gray" id="lcl">Đóng</button>`);
  m.classList.add('lock');
  lockS={q,val:'',onOk,m,until:0};
  $('#lcl').onclick=()=>{m.remove();lockS=null};
}
function choreLockPress(k){
  const L=lockS;if(!L||!L.m.isConnected)return;
  if(k==='⌫')L.val=L.val.slice(0,-1);
  else if(k==='✓'){
    if(L.val===''||Date.now()<L.until)return;
    if(+L.val===L.q.answer){lockS=null;L.m.remove();sfx.ok();L.onOk();return}
    sfx.bad();mascotSay('parent_wrong');L.q=lockQuestion();L.val='';L.until=Date.now()+LOCK_WRONG_COOLDOWN_MS;
    const b=L.m.querySelector('.box');if(b){b.classList.remove('shk');void b.offsetWidth;b.classList.add('shk')}
  }else if(L.val.length<4)L.val+=k;
  if(k!=='✓')sfx.click();
  const q=$('#lq'),a=$('#lans');
  if(q)q.textContent=L.q.text+' = ?';
  if(a)a.innerHTML=L.val||'&nbsp;';
}
/* Hộp quà chăm ngoan: dùng chung lớp phủ mở quà; lời Kuromi theo loại quà */
function choreBoxGift(){
  const p=choreBoxOpen();if(!p)return {pic:'🎁',title:'',line:'gift_open'};
  if(p.kind==='sticker')return {pic:p.value,title:'Hình dán mới!',line:'sticker_new'};
  if(p.kind==='dress'){const it=SHOP_ITEMS.find(x=>x.id===p.value);
    return {pic:`<img class="gdress" src="${it.thumb}" alt="${esc(it.name)}" draggable="false">`,title:`Váy mới: ${esc(it.name)}!`,line:'gift_dress'}}
  if(p.kind==='song'){const it=radioItem(p.value);return {pic:it.icon,title:`Bài mới: ${esc(it.name)}!`,line:'gift_song'}}
  if(p.kind==='talk')return {pic:'💬',title:`+${p.value} câu hỏi với Kuromi!`,line:'gift_talk'};
  return {pic:'🌟',title:`Bạn đã có tất cả quà! +${p.value} ⭐`,line:'chore_box_stars'};
}
function openChoreBox(done){giftOverlay({count:choreBoxes,take:choreBoxGift,done:done||(()=>chores(true))})}
