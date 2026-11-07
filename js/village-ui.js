/* Giao diện làng 3D dùng chung (Noel, Tết): màn chọn đồ, màn làng, hộp thoại với nhân vật, tìm đồ và ăn mừng.
   Mỗi làng đưa vào một cấu hình (cfg):
   {logic,                          // từ makeVillage (js/village.js)
    title, icon, btnCls, waitIcon,  // tên làng, biểu tượng, lớp nút "Vào làng", biểu tượng màn chờ
    lines,                          // tiền tố nhóm lời: 'xmas' → xmas_enter, xmas_<npc>_hi…
    npcIcons:{id:emoji}, partyIcons:[emoji],
    world:{bound, base, sky?, ground?, particles?},   // đưa thẳng vào w3Create
    map:{start, npcs:{id:{x,z,r,rotY?,meet}}},
    around:{x,z,r}|null,            // vật cản lớn giữa làng mà đường đi phải vòng qua
    build:async (w,my)=>void,       // dựng cảnh tĩnh riêng của làng
    npcObj:async (w,npc)=>Object3D|null, itemObj:async (w,item)=>Object3D|null}
   Chỉ một làng mở tại một thời điểm: vilCfg là làng đang mở. */

/* ============ Màn chọn đồ ============ */
function vilHome(cfg){
  vilCfg=cfg;
  const cur=vilOutfit().id;
  const grid=vilOutfits().map(o=>`<button class="xo btn${o.id===cur?' on':''}" data-id="${esc(o.id)}"><img src="${esc(o.src)}" alt=""><span>${esc(o.name)}</span></button>`).join('');
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'sm'},cls:'vil-pick vil-'+cfg.logic.id,
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button>${cfg.icon} ${esc(cfg.title)}</div>`,
    body:`<div class="xgrid">${grid}</div><div class="row"><button class="btn ${cfg.btnCls} gloss" id="xgo" onclick="goTap(this,vilVillage)">${cfg.icon} Vào làng</button></div>`});
  document.querySelectorAll('.xo').forEach(b=>b.onclick=()=>{
    sfx.click();vilSetOutfit(b.dataset.id);
    document.querySelectorAll('.xo').forEach(x=>x.classList.toggle('on',x===b));
  });
  mascotSay(cfg.lines+'_outfit');
}

/* ============ Trạng thái màn làng ============ */
let vilCfg=null,vilWorld=null,vilSess=null,vilGen=0,vilTok=0,vilDlgOn=false,vilReady=false;
let vilNpcH={},vilPicks={},vilPlanCur=null,vilPlayer=null;
let vilQuestDay={};      // ngày đã nhận việc tìm đồ, theo từng làng (cfg.logic.id)
let VIL_BUILD_MS=25000;  // quá lâu chưa dựng xong làng thì báo "Làng đang ngủ", không để bé kẹt ở màn chờ
let VIL_NEXT_MS=900;     // dừng giữa hai câu đố để bé thấy nút xanh
const vilCurPlan=()=>vilPlanCur||(vilPlanCur=vilCfg.logic.plan(vilCfg.logic.state().day));
const vilItem=()=>vilCfg.logic.items.find(i=>i.id===vilCurPlan().item);
const vilNpc=id=>vilCfg.logic.npcs.find(p=>p.id===id);
/* đã nhận việc tìm đồ hôm nay (bấm "Đi tìm!" hoặc đã nhặt ít nhất 1 món) */
function vilQuestOn(){const x=vilCfg.logic.state();return vilQuestDay[vilCfg.logic.id]===x.day||x.found.length>0}

/* Rời màn làng bằng bất kỳ đường nào: dừng vòng render, giải phóng renderer, huỷ mọi việc đang chờ.
   Giữ vilCfg để vilNewDay dựng lại đúng làng đang mở. */
function vilLeave(){
  vilGen++;vilTok++;vilSess=null;vilDlgOn=false;vilReady=false;vilNpcH={};vilPicks={};vilPlanCur=null;vilPlayer=null;
  if(vilWorld){const w=vilWorld;vilWorld=null;try{w.dispose()}catch(e){}}
}
if(typeof go==='function'){const _vgo=go;go=function(fn){vilLeave();return _vgo(fn)}}

/* không có tham số thì dựng lại làng đang mở (vilCfg) */
function vilVillage(cfg){
  if(cfg)vilCfg=cfg;
  vilLeave();
  const my=vilGen,C=vilCfg;
  vilPlanCur=C.logic.plan(C.logic.state().day);
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'sm'},cls:'vil vil-'+C.logic.id,
    top:`<div class="ttl xtop"><button class="back" onclick="goTap(this,home)">⬅️</button><div class="xbar" id="xbar"></div><span class="coin" id="xcoin">⭐ ${balance()}</span></div>`,
    body:`<canvas class="xcv" id="xcv"></canvas><div class="xwait" id="xwait"><span>${C.waitIcon}</span>Kuromi đang dẫn đường…</div>
      <div class="xdlg" id="xdlg"></div><div id="tt"></div>`});
  if(!w3Supported())return vilFail();
  vilBar();
  vilBuild(my).catch(e=>{if(my===vilGen){console.warn(C.title+' không dựng được',e);vilFail()}});
  /* vilFail → vilLeave tăng vilGen, nên bản dựng về muộn sẽ tự giải phóng (xem vilBuild) */
  setTimeout(()=>{if(my===vilGen&&!vilReady){console.warn(C.title+' dựng quá lâu');vilFail()}},VIL_BUILD_MS);
}
/* Không có WebGL hoặc nạp lỗi: báo nhẹ nhàng, cho về trang chủ (module nạp lỗi bị trình duyệt nhớ, nên không thử lại tại chỗ) */
function vilFail(){
  vilLeave();
  const C=vilCfg;
  app.innerHTML=screenHTML({mascot:{emo:'think',size:'sm'},cls:'vil-pick vil-'+C.logic.id,
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button>${C.icon} ${esc(C.title)}</div>`,
    body:`<div class="xfail card3d"><div class="xfz">💤</div><p>Làng đang ngủ, mình quay lại sau nha 💤</p>
      <p class="xsub">Bố mẹ có thể tải lại trang rồi vào lại làng.</p>
      <button class="btn p-pink gloss" onclick="goTap(this,home)">🏠 Về trang chủ</button></div>`});
}

/* phần chung: tạo thế giới, nhân vật, búp bê, chạm/nhặt, camera; cảnh riêng của làng do cfg.build dựng */
async function vilBuild(my){
  const cv=$('#xcv'),C=vilCfg;
  const w=await w3Create(cv,C.world);
  if(my!==vilGen){w.dispose();return}
  vilWorld=w;
  const jobs=[C.build(w,my)];
  C.logic.npcs.forEach(p=>jobs.push(vilNpcMake(w,p,my)));
  await Promise.all(jobs);
  if(my!==vilGen)return;
  vilPlayer=w.player(vilOutfit().src,vilStartPos());
  w.onTap(vilTapped);
  w.onPickup(vilFound);
  /* màn bị thay mà không qua go(): tự giải phóng ở lượt sau */
  let gone=false,lift=-.08;
  w.onFrame(dt=>{
    if(!gone&&!cv.isConnected){gone=true;setTimeout(()=>{if(my===vilGen)vilLeave()})}
    /* bình thường dời camera lên bắc một chút (thanh trên che mép trên); mở hộp thoại thì lùi về nam
       để bé và nhân vật nổi lên nửa trên màn, không bị hộp thoại che */
    lift+=((vilDlgOn?(w.camera.aspect<1?.2:.34):-.08)-lift)*Math.min(1,dt*4);
    w.camera.position.z+=lift*(w.camera.position.y-.6);
  });
  vilReady=true;
  const wait=$('#xwait');if(wait)wait.remove();
  vilMarks();
  if(vilQuestOn())vilSpawn();
  mascotSay(C.lines+(C.logic.progress().done>=C.logic.npcs.length?'_all_done':'_enter'));
}
async function vilNpcMake(w,p,my){
  const pos=vilCfg.map.npcs[p.id];
  const obj=await vilCfg.npcObj(w,p);
  if(!obj||my!==vilGen)return;
  vilNpcH[p.id]=w.npc(p.id,obj,{x:pos.x,z:pos.z,r:pos.r,rotY:pos.rotY||0});
}
/* chỗ búp bê xuất hiện: cạnh nhân vật đầu tiên còn việc; xong hết thì ở chỗ mặc định */
function vilStartPos(){
  const L=vilCfg.logic,p=L.npcs.find(n=>L.status(n.id)!=='done');
  return p?vilCfg.map.npcs[p.id].meet:vilCfg.map.start;
}

/* ============ Thanh việc, nhãn trên đầu, đồ để nhặt ============ */
function vilBar(){
  const b=$('#xbar');
  if(b){
    const L=vilCfg.logic,plan=vilCurPlan(),item=vilItem(),x=L.state();
    const cnt=vilQuestOn()&&L.status(plan.quest)!=='done'?`<span class="xcnt" id="xcnt">${item.icon} ${Math.min(3,x.found.length)}/3</span>`:'';
    b.innerHTML=L.npcs.map(p=>{const ok=L.status(p.id)==='done';
      return `<button class="xbi${ok?' ok':''}" title="${esc(p.name)}" aria-label="Đi tới ${esc(p.name)}" onclick="vilGoNpc('${p.id}')">${vilCfg.npcIcons[p.id]}${ok?'<i>✓</i>':''}</button>`}).join('')+cnt;
  }
  const c=$('#xcoin');if(c)c.textContent=`⭐ ${balance()}`;
}
function vilMarks(){
  const L=vilCfg.logic,icon=vilItem().icon;
  L.npcs.forEach(p=>{
    const st=L.status(p.id),h=vilNpcH[p.id];
    /* đang chờ bé mang đồ về (đã nhận việc đi tìm, hoặc đã tìm đủ) thì hiện món đồ */
    if(h)h.setMark(st==='done'?'✅':st==='return'||(st==='quest'&&vilQuestOn())?icon:'❗');
  });
  vilBar();
}
/* sinh đồ ở các chỗ giấu hôm nay chưa nhặt (chỉ khi đã nhận việc và thế giới đã dựng xong) */
function vilSpawn(){
  const w=vilWorld;if(!w||!vilReady||typeof w.pickup!=='function')return;
  const C=vilCfg,L=C.logic,plan=vilCurPlan(),x=L.state(),item=vilItem(),my=vilGen;
  if(L.status(plan.quest)==='done')return;
  plan.spots.filter(s=>!x.found.includes(s)&&!vilPicks[s]).forEach(s=>{
    vilPicks[s]='…';
    C.itemObj(w,item).then(o=>{
      if(!o||my!==vilGen||vilWorld!==w)return;
      if(L.state().found.includes(s)){delete vilPicks[s];return}
      vilPicks[s]=w.pickup(s,o,L.spots[s]);
    }).catch(e=>{
      console.warn('Không dựng được món đồ cần tìm',e);
      if(my===vilGen)delete vilPicks[s];   // bỏ chỗ giữ để lần sau sinh lại
    });
  });
}
/* bé đi tới gần một món đồ */
function vilFound(spot){
  const L=vilCfg.logic,plan=vilCurPlan();
  if(!L.pickup(spot,plan.day))return false;
  const p=vilPicks[spot];
  if(p&&p.remove)p.remove();
  delete vilPicks[spot];
  sfx.ok();
  if(L.state().found.length>=3){const q=vilNpc(plan.quest);mascot('clap',`Đủ rồi! Mang về cho ${q?q.name:'bạn ấy'} nha!`)}
  else mascotSay(vilCfg.lines+'_found');
  vilBar();
  const c=$('#xcnt');
  if(c){burst(c,3,[vilItem().icon,'✨']);c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}
  vilMarks();
  return true;
}
/* Đi tới (x,z). Không tìm đường: chỉ khi đường thẳng cắt vòng vật cản lớn giữa làng (cfg.around)
   thì đi qua một điểm vòng bên cạnh (phía cho đường ngắn hơn), rồi mới tới đích */
function vilRoute(x,z,stop,done){
  const w=vilWorld,pl=vilPlayer,c=vilCfg.around;if(!w)return;
  let wp=null;
  if(pl&&c){
    const R=c.r+.3;
    const dx=x-pl.x,dz=z-pl.z,L=Math.hypot(dx,dz)||1;
    const t=Math.max(0,Math.min(1,((c.x-pl.x)*dx+(c.z-pl.z)*dz)/(L*L)));
    if(Math.hypot(pl.x+dx*t-c.x,pl.z+dz*t-c.z)<R){
      const nx=-dz/L,nz=dx/L,Rw=c.r+1.7;
      const cand=[1,-1].map(k=>({x:c.x+k*nx*Rw,z:c.z+k*nz*Rw}));
      const len=q=>Math.hypot(q.x-pl.x,q.z-pl.z)+Math.hypot(x-q.x,z-q.z);
      wp=len(cand[0])<=len(cand[1])?cand[0]:cand[1];
    }
  }
  /* chặng vòng kẹt thì vẫn thử đi tiếp tới đích (trượt theo mép vật cản) */
  if(wp)w.walkTo(wp.x,wp.z,.3,()=>{if(vilWorld===w)w.walkTo(x,z,stop,done)});
  else w.walkTo(x,z,stop,done);
}
/* Đi tới nhân vật rồi nói chuyện: đứng bên cạnh (không đứng trước, kẻo búp bê che nhân vật).
   Kẹt mà đã đủ gần thì vẫn nói chuyện; kẹt xa thì Kuromi chỉ cách dùng thanh trên */
function vilGoNpc(id){
  const w=vilWorld,n=vilCfg.map.npcs[id];
  if(!w||!n||vilDlgOn||!vilReady)return;
  const pl=vilPlayer,sx=pl&&pl.x<n.x?-1:1,near=()=>pl&&Math.hypot(pl.x-n.x,pl.z-n.z)<2.2;
  vilRoute(n.x+sx*1.3,n.z+.3,.2,ok=>{
    if(vilWorld!==w)return;
    if(ok||near())vilTalk(id);
    else mascot('think','Bấm vào hình bạn ấy ở thanh trên nha!');
  });
}
function vilTapped(ev){
  const w=vilWorld;
  if(!w||vilDlgOn)return;
  if(ev.kind==='npc')vilGoNpc(ev.id);
  else if(ev.kind==='pickup')vilRoute(ev.x,ev.z,0);
  else w.walkTo(ev.x,ev.z);
}

/* ============ Hộp thoại ============ */
/* chuỗi lời nói: chạy nối tiếp, dừng ngay khi có lời mới, bé trả lời, hoặc đóng hộp thoại */
function vilSpeak(...steps){
  const my=++vilTok;
  let p=Promise.resolve(steps[0]());
  for(const f of steps.slice(1))p=p.then(()=>my===vilTok?f():null);
  return p.catch(()=>{});
}
/* nhân vật nói một câu của nhóm: chữ hiện trong hộp thoại (không phải bong bóng của Kuromi) */
function vilNpcLine(group){
  const {line,done}=voice.line(group);
  const t=$('#xdlg .xsay');if(t)t.textContent=line.text;
  if(vilSess)vilSess.say=line.text;
  return done;
}
function vilDlg(id,{say='',body='',btns=''}={}){
  const d=$('#xdlg');if(!d)return;
  const p=vilNpc(id);
  vilDlgOn=true;
  d.innerHTML=`<div class="xbox card3d"><div class="xwho"><span class="xic">${vilCfg.npcIcons[id]}</span><b>${esc(p.name)}</b>
    <button class="xx" onclick="vilClose()" aria-label="Đóng">✖</button></div>
    <div class="xsay">${esc(say)}</div>${body}${btns?`<div class="row xbtns">${btns}</div>`:''}</div>`;
  d.classList.add('on');
}
function vilClose(){
  vilTok++;voice.stop();vilSess=null;vilDlgOn=false;
  const d=$('#xdlg');if(d){d.classList.remove('on');d.innerHTML=''}
}
/* sang ngày mới khi đang chơi: tiến độ hôm qua không còn, dựng lại làng đang mở cho ngày mới */
function vilNewDay(){
  const my=vilGen;
  toast('Sang ngày mới rồi!');
  setTimeout(()=>{if(my===vilGen)go(vilVillage)},1500);
}
const VIL_BYE=`<button class="btn p-pink gloss" onclick="vilClose()">Tạm biệt 👋</button>`;
function vilTalk(id){
  if(vilDlgOn||!vilNpc(id))return;
  const L=vilCfg.logic,pre=vilCfg.lines,plan=vilCurPlan();
  if(plan.day!==dayStr(new Date()))return vilNewDay();
  const st=L.status(id),item=vilItem();
  if(st==='done'){
    vilDlg(id,{btns:VIL_BYE});
    vilSpeak(()=>vilNpcLine(`${pre}_${id}_thanks`));
  }else if(st==='quiz')vilQuizOpen(id,plan);
  else if(st==='quest'){
    const n=L.state().found.length,on=vilQuestOn();
    const ask=on?`Bạn tìm được ${n}/3 ${item.name} rồi, tìm tiếp nha!`:`Tìm giúp tớ 3 ${item.name} ${item.icon} nha!`;
    vilDlg(id,{body:`<div class="xq">${esc(ask)}<button class="xspk" onclick="voice.text(this.parentNode.firstChild.textContent)">🔊</button></div>`,
      btns:`<button class="btn p-green gloss" id="xok" onclick="vilAccept()">${on?'Đi tìm tiếp!':'Đi tìm!'} ${item.icon}</button>`});
    vilSpeak(()=>vilNpcLine(`${pre}_${id}_hi`),()=>mascotSay(pre+'_quest'),()=>voice.text(ask));
  }else{
    vilDlg(id,{say:'…'});
    vilFinish(id,3,plan.day);
  }
}
function vilAccept(){
  vilQuestDay[vilCfg.logic.id]=vilCurPlan().day;
  vilClose();sfx.click();
  vilSpawn();vilMarks();
}

/* ---- phiên đố: 3 câu liên tiếp ---- */
function vilQuizOpen(id,plan){
  const s=vilSess=vilCfg.logic.quizNew(id,plan);
  s.tried=[];s.lock=false;s.done=false;s.say='';
  vilQuizDraw(s);
  const q=s.qs[s.i],pre=vilCfg.lines;
  vilSpeak(()=>mascotSay(pre+'_quiz'),()=>vilNpcLine(`${pre}_${id}_hi`),()=>voice.text(q.q));
}
function vilQuizDraw(s){
  const q=s.qs[s.i];
  vilDlg(s.npc,{say:s.say,body:`<div class="xq"><span class="xn">${s.i+1}/${s.qs.length}</span>${esc(q.q)}<button class="xspk" onclick="vilRead()">🔊</button></div>
    <div class="chs xchs n${q.choices.length}">${q.choices.map((c,i)=>`<button class="ch btn enter" style="--d:${(i*.05).toFixed(2)}s" onclick="vilChoose(${i})">${esc(c)}</button>`).join('')}</div>`});
}
function vilRead(){const s=vilSess;if(s&&s.qs[s.i]){vilTok++;voice.text(s.qs[s.i].q)}}
const vilBtn=i=>document.querySelectorAll('#xdlg .ch')[i];
/* bé chọn đáp án i: khoá trong lúc xử lý để bấm đúp không chấm hai lần */
function vilChoose(i){
  const s=vilSess;
  if(!s||s.done||s.lock||s.tried.includes(i))return;
  const q=s.qs[s.i];
  if(!q||!(i>=0&&i<q.choices.length))return;
  s.lock=true;vilTok++;
  const r=vilQuizAnswer(s,i),b=vilBtn(i);
  if(!r.ok){
    s.tried.push(i);s.lock=false;
    sfx.bad();if(b)b.classList.add('bad');
    if(r.hint){const c=vilBtn(q.correct);if(c)c.classList.add('hint');mascotSay('hint')}
    else mascotSay('wrong');
    return;
  }
  sfx.ok();if(b)b.classList.add('good');
  const said=mascotSay('correct');
  /* xong câu 3: cộng sao và lưu ngay (đóng hộp thoại hay rời làng lúc này cũng không mất), chỉ hoãn phần hiển thị */
  let res=null;
  if(r.done){s.done=true;res=vilCfg.logic.complete(s.npc,r.stars,s.day);if(res)vilMarks()}
  const my=vilGen;
  /* chờ Kuromi khen xong (ít nhất VIL_NEXT_MS, tối đa 2,5 giây) rồi mới sang câu sau */
  voiceWait(said,VIL_NEXT_MS,Math.max(VIL_NEXT_MS,2500)).then(()=>{
    if(vilSess!==s){if(res&&res.bonus>0&&my===vilGen)vilParty(res.bonus);return}
    if(r.done){vilShowDone(s.npc,res,s.day);return}
    s.tried=[];s.lock=false;vilQuizDraw(s);
    const nq=s.qs[s.i];
    vilSpeak(()=>voice.text(nq.q));
  });
}

/* ---- xong một việc: cộng sao, cảm ơn, cập nhật nhãn; đủ cả các việc thì ăn mừng ---- */
function vilFinish(id,stars,day){
  const r=vilCfg.logic.complete(id,stars,day);
  if(r)vilMarks();
  vilShowDone(id,r,day);
}
function vilParty(n){
  confetti(40);
  burst($('#xbar'),12,vilCfg.partyIcons);
  toast(`+${n} ⭐ thưởng hoàn thành!`);
}
/* hiện kết quả một việc đã cộng sao (r từ logic.complete; null là không cộng được) */
function vilShowDone(id,r,day){
  vilSess=null;
  if(!r){
    if(day!==dayStr(new Date())){vilClose();vilNewDay()}
    else vilClose();
    return;
  }
  vilDlg(id,{body:`<div class="xgain">+${r.stars} ⭐</div>`,btns:VIL_BYE});
  sfx.win();
  const box=$('#xdlg .xbox');burst(box,8,['⭐','✨']);
  const pre=vilCfg.lines;
  if(r.bonus>0){
    vilParty(r.bonus);
    vilSpeak(()=>vilNpcLine(`${pre}_${id}_thanks`),()=>mascotSay(pre+'_all_done'));
  }else vilSpeak(()=>vilNpcLine(`${pre}_${id}_thanks`));
}
