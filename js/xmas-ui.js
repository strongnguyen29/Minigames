/* Làng Giáng Sinh: màn chọn đồ, màn làng 3D, hộp thoại với nhân vật, tìm đồ và ăn mừng */
function xmasHome(){
  const cur=xmasOutfit().id;
  const grid=xmasOutfits().map(o=>`<button class="xo btn${o.id===cur?' on':''}" data-id="${esc(o.id)}"><img src="${esc(o.src)}" alt=""><span>${esc(o.name)}</span></button>`).join('');
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'sm'},cls:'xmas-pick',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button>🎄 Làng Giáng Sinh</div>`,
    body:`<div class="xgrid">${grid}</div><div class="row"><button class="btn p-green gloss" id="xgo" onclick="goTap(this,xmasVillage)">🎄 Vào làng</button></div>`});
  document.querySelectorAll('.xo').forEach(b=>b.onclick=()=>{
    sfx.click();xmasSetOutfit(b.dataset.id);
    document.querySelectorAll('.xo').forEach(x=>x.classList.toggle('on',x===b));
  });
  mascotSay('xmas_outfit');
}

/* ============ Bản đồ làng (dữ liệu cố định) ============
   Trục x sang phải, z về phía camera (xuống dưới màn hình). Nhà gỗ đặt sát rìa bắc,
   vì phía sau nhà (bắc) bị nhà che khi nhìn từ camera. */
const XMAS_TRACK_S=2.4;                 // tỉ lệ đường ray quanh cây thông
const XMAS_TREE={x:0,z:-2};             // tâm cây thông lớn và vòng tàu
const XMAS_NPC_SCALE=1.25;
/* nhà gỗ 2×1 ô (chưa nhân tỉ lệ 2): [model, x, y, z, rotY, lật ngang] */
const XMAS_CABIN=[['cabin-door-rotate',-.5,0,0,0],['cabin-window-b',.5,0,0,0],['cabin-wall',-.5,0,0,Math.PI],['cabin-wall',.5,0,0,Math.PI],
  ['cabin-window-a',.5,0,0,Math.PI/2],['cabin-wall-wreath',-.5,0,0,-Math.PI/2],
  ['cabin-corner',-.5,0,0,0],['cabin-corner',.5,0,0,-Math.PI/2],['cabin-corner',.5,0,0,Math.PI],['cabin-corner',-.5,0,0,Math.PI/2],
  ['cabin-roof-snow-chimney',.5,1,0,0],['cabin-roof-snow',-.5,1,0,Math.PI],
  ['cabin-wall-roof',.5,1,0,0],['cabin-wall-roof',-.5,1,0,0,1],['cabin-wall-roof',-.5,1,0,Math.PI],['cabin-wall-roof',.5,1,0,Math.PI,1]];
/* vật cản của một nhà: 4 vòng tròn dọc theo chiều dài nhà */
const xmasCabinSolids=c=>[-1.6,-.55,.55,1.6].map(k=>({x:c.x+k*Math.cos(c.rotY||0),z:c.z-k*Math.sin(c.rotY||0),r:1.2}));
const XMAS_MAP=(()=>{
  const bound={rx:24,rz:16},props=[];
  const P=(model,x,z,o={})=>props.push(Object.assign({model,x:+x.toFixed(2),z:+z.toFixed(2),rotY:0,scale:1,solid:0},o));
  const s=XMAS_TRACK_S,c=XMAS_TREE;
  /* giữa làng: cây thông lớn, quà dưới gốc, vòng ray (vật cản bao cả vòng ray để bé không đứng trên đường tàu) */
  P('tree-decorated-snow',c.x,c.z,{scale:2.4,solid:3.8});
  [['present-b-rectangle',1],['present-b-round',3],['present-a-rectangle',5],['present-b-cube',7]].forEach(([m,k])=>
    P(m,c.x+2.5*Math.cos(k*Math.PI/4),c.z+2.5*Math.sin(k*Math.PI/4),{scale:1.6,rotY:k}));
  for(const k of [-.25,.25]){
    P('trainset-rail-straight',c.x+1.25*s,c.z+k*s,{rotY:Math.PI/2,scale:s});P('trainset-rail-straight',c.x-1.25*s,c.z+k*s,{rotY:Math.PI/2,scale:s});
    P('trainset-rail-straight',c.x+k*s,c.z+1.25*s,{scale:s});P('trainset-rail-straight',c.x+k*s,c.z-1.25*s,{scale:s});
  }
  /* khúc cong: cung 1/4 bán kính .75 quanh tâm góc (±.5,±.5), gốc model lệch (.5,.5) so với tâm cung */
  [[1,1,0],[1,-1,Math.PI/2],[-1,-1,Math.PI],[-1,1,-Math.PI/2]].forEach(([sx,sz,r])=>P('trainset-rail-bend',c.x+sx*s,c.z+sz*s,{rotY:r,scale:s}));
  /* rìa làng: hai vòng cây thông + đá lớn nằm ngoài biên, làm ranh giới tự nhiên */
  const rng=xmasRng(1225),TREES=['tree-snow-a','tree','tree-snow-b','tree-snow-c'];
  for(const [gap,n,big] of [[1.8,64,1.3],[5,56,1.7]])for(let i=0;i<n;i++){
    const a=(i+(gap>2?.5:0))/n*Math.PI*2,south=Math.sin(a)>.3;
    const m=gap<2&&i%9===4?'rocks-large':TREES[Math.floor(rng()*TREES.length)];
    const sc=m==='rocks-large'?.8+rng()*.4:(south?1+rng()*.3:big+rng()*.4);
    P(m,Math.cos(a)*(bound.rx+gap+rng()),Math.sin(a)*(bound.rz+gap+rng()),{rotY:rng()*6,scale:sc});
  }
  /* đường đá bước chân: vòng quanh cây thông và các nhánh tới từng khu.
     Gạch kit có gốc ở góc ô (x -1..0, z 0..1) nên dời gốc theo góc xoay để tâm viên đá nằm đúng điểm */
  const stone=(x,z)=>{const r=Math.floor(rng()*4)*Math.PI/2,k=.8;
    P('floor-stone',x+k*(.5*Math.cos(r)-.5*Math.sin(r)),z-k*(.5*Math.sin(r)+.5*Math.cos(r)),{rotY:r,scale:k})};
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2;stone(c.x+7*Math.cos(a),c.z+6.5*Math.sin(a))}
  const lane=(x1,z1,x2,z2)=>{const n=Math.round(Math.hypot(x2-x1,z2-z1)/1.4);for(let i=1;i<=n;i++)stone(x1+(x2-x1)*i/n,z1+(z2-z1)*i/n)};
  lane(-7,-2,-15.5,0);lane(7,-2,15.5,1);lane(0,-8.5,0,-11.5);lane(0,4.5,0,12);lane(3.5,3.6,6.8,9);
  lane(-4.5,-7,-12.6,-10.4);lane(4.5,-7,12.6,-10.4);
  /* trong làng: đèn đường, ghế, xe trượt, đá, đống tuyết, vài cụm thông */
  [[-2,9.5],[2,9.5],[-10,-2.8],[10,.3],[-11,-9.6],[11,-9.6],[-2,-9],[5,-12],[-19,-1.5],[19,-1]].forEach(([x,z])=>P('lantern',x,z,{solid:.35}));
  P('bench',-7,7.5,{solid:.6});P('bench',8,5.5,{rotY:-.4,solid:.6});P('bench',-3,-12,{solid:.6});
  P('sled',19,-3.5,{rotY:.5,scale:1.4,solid:.6});P('sled-long',-9,9,{rotY:-.7,scale:1.3,solid:.6});
  P('rocks-medium',-20,-5,{solid:1});P('rocks-medium',18,-8,{rotY:2,solid:1});P('rocks-small',-4,15,{solid:.7});P('rocks-small',15,12,{rotY:1,solid:.7});
  [[-15,4],[14,5],[-4,-8],[5,13],[-10,13],[16,-3],[-20,8],[9,-14],[-8,-14],[21,6]].forEach(([x,z],i)=>P('snow-pile',x,z,{rotY:i,scale:1.6}));
  [[-12,1],[13,-1],[-3,6],[10,13]].forEach(([x,z],i)=>P('snow-bunker',x,z,{rotY:i*1.3,scale:1.2}));
  [[-16,9,'tree-snow-b'],[16,10,'tree-snow-b'],[-11,5,'tree-snow-a'],[12.5,-3.5,'tree-snow-c'],[-21,2,'tree-snow-a'],[4,-15,'tree-snow-c'],[-6,15,'tree-snow-b']]
    .forEach(([x,z,m])=>P(m,x,z,{scale:1.25,solid:.7}));
  [[-15.6,-10.2],[1.6,-12.9],[12.4,-10.2],[-1.6,-12.9]].forEach(([x,z])=>P('candy-cane-green',x,z,{scale:2}));
  return {bound,start:{x:0,z:4.8},props,
    cabins:[{x:-14,z:-11.8,rotY:0},{x:0,z:-14.5,rotY:0},{x:14,z:-11.8,rotY:0}],
    /* meet: chỗ búp bê xuất hiện khi vào làng, ngay dưới bên phải nhân vật để vừa vào đã thấy nhân vật và dấu ❗ */
    npcs:{santa:{x:0,z:-10,r:.45,meet:{x:1.8,z:-6.8}},snowman:{x:-17,z:0,r:.6,meet:{x:-15.2,z:3.2}},
      reindeer:{x:17,z:1,r:.6,meet:{x:15.2,z:4.2}},nutcracker:{x:8,z:10,r:.4,meet:{x:6.2,z:13.2}}}};
})();
/* chỗ búp bê xuất hiện: cạnh nhân vật đầu tiên còn việc; xong hết thì ở chỗ mặc định trước cây thông */
function xmasStartPos(){
  const p=XMAS_NPCS.find(n=>xmasStatus(n.id)!=='done');
  return p?XMAS_MAP.npcs[p.id].meet:XMAS_MAP.start;
}
/* vị trí và hướng trên vòng ray (tàu chạy theo), u là quãng đường đã đi */
function xmasTrackAt(u){
  const s=XMAS_TRACK_S,a=.5*s,R=.75*s,Ls=2*a+Math.PI*R/2;
  u=((u%(4*Ls))+4*Ls)%(4*Ls);
  const k=Math.floor(u/Ls),t=u-k*Ls;
  let x,z,dx,dz;
  if(t<2*a){x=a+R;z=-a+t;dx=0;dz=1}
  else{const f=(t-2*a)/R;x=a+R*Math.cos(f);z=a+R*Math.sin(f);dx=-Math.sin(f);dz=Math.cos(f)}
  for(let i=0;i<k;i++){[x,z]=[-z,x];[dx,dz]=[-dz,dx]}
  return {x:XMAS_TREE.x+x,z:XMAS_TREE.z+z,rot:Math.atan2(-dz,dx)};
}

/* ============ Trạng thái màn làng ============ */
const XMAS_ICON={santa:'🎅',snowman:'⛄',reindeer:'🦌',nutcracker:'💂'};
let xmasWorld=null,xmasSess=null,xmasGen=0,xmasTok=0,xmasDlgOn=false,xmasReady=false;
let xmasNpcH={},xmasPicks={},xmasPlanCur=null,xmasQuestDay='',xmasPlayer=null;
let XMAS_NEXT_MS=900;   // dừng giữa hai câu đố để bé thấy nút xanh
const xmasCurPlan=()=>xmasPlanCur||(xmasPlanCur=xmasPlan(xmasState().day));
const xmasItem=()=>XMAS_ITEMS.find(i=>i.id===xmasCurPlan().item);
const xmasNpc=id=>XMAS_NPCS.find(p=>p.id===id);
/* đã nhận việc tìm đồ hôm nay (bấm "Đi tìm!" hoặc đã nhặt ít nhất 1 món) */
function xmasQuestOn(){const x=xmasState();return xmasQuestDay===x.day||x.found.length>0}

/* Rời màn làng bằng bất kỳ đường nào: dừng vòng render, giải phóng renderer, huỷ mọi việc đang chờ */
function xmasLeave(){
  xmasGen++;xmasTok++;xmasSess=null;xmasDlgOn=false;xmasReady=false;xmasNpcH={};xmasPicks={};xmasPlanCur=null;xmasPlayer=null;
  if(xmasWorld){const w=xmasWorld;xmasWorld=null;try{w.dispose()}catch(e){}}
}
if(typeof go==='function'){const _xgo=go;go=function(fn){xmasLeave();return _xgo(fn)}}

function xmasVillage(){
  xmasLeave();
  const my=xmasGen;
  xmasPlanCur=xmasPlan(xmasState().day);
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'sm'},cls:'xmas',
    top:`<div class="ttl xtop"><button class="back" onclick="goTap(this,home)">⬅️</button><div class="xbar" id="xbar"></div><span class="coin" id="xcoin">⭐ ${balance()}</span></div>`,
    body:`<canvas class="xcv" id="xcv"></canvas><div class="xwait" id="xwait"><span>❄️</span>Kuromi đang dẫn đường…</div>
      <div class="xdlg" id="xdlg"></div><div id="tt"></div>`});
  if(!w3Supported())return xmasFail();
  xmasBar();
  xmasBuild(my).catch(e=>{if(my===xmasGen){console.warn('Làng Giáng Sinh không dựng được',e);xmasFail()}});
}
/* Không có WebGL hoặc nạp lỗi: báo nhẹ nhàng, cho về trang chủ (module nạp lỗi bị trình duyệt nhớ, nên không thử lại tại chỗ) */
function xmasFail(){
  xmasLeave();
  app.innerHTML=screenHTML({mascot:{emo:'think',size:'sm'},cls:'xmas-pick',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,home)">⬅️</button>🎄 Làng Giáng Sinh</div>`,
    body:`<div class="xfail card3d"><div class="xfz">💤</div><p>Làng đang ngủ, mình quay lại sau nha 💤</p>
      <p class="xsub">Bố mẹ có thể tải lại trang rồi vào lại làng.</p>
      <button class="btn p-pink gloss" onclick="goTap(this,home)">🏠 Về trang chủ</button></div>`});
}

async function xmasBuild(my){
  const cv=$('#xcv');
  const w=await w3Create(cv,{bound:XMAS_MAP.bound,base:'models/holiday/'});
  if(my!==xmasGen){w.dispose();return}
  xmasWorld=w;
  const M=XMAS_MAP,by={},jobs=[];
  M.props.forEach(p=>(by[p.model]=by[p.model]||[]).push(p));
  /* model lặp từ 3 lần trở lên thì vẽ bằng InstancedMesh */
  for(const [name,list] of Object.entries(by))jobs.push(list.length>=3?w.instances(name,list):Promise.all(list.map(p=>w.model(name,p))));
  M.cabins.forEach(c=>jobs.push(xmasCabin(w,c)));
  XMAS_NPCS.forEach(p=>jobs.push(xmasNpcMake(w,p,my)));
  jobs.push(xmasTrain(w));
  await Promise.all(jobs);
  if(my!==xmasGen)return;
  xmasPlayer=w.player(xmasOutfit().src,xmasStartPos());
  w.onTap(xmasTapped);
  w.onPickup(xmasFound);
  /* màn bị thay mà không qua go(): tự giải phóng ở lượt sau */
  let gone=false,lift=-.08;
  w.onFrame(dt=>{
    if(!gone&&!cv.isConnected){gone=true;setTimeout(()=>{if(my===xmasGen)xmasLeave()})}
    /* bình thường dời camera lên bắc một chút (thanh trên che mép trên); mở hộp thoại thì lùi về nam
       để bé và nhân vật nổi lên nửa trên màn, không bị hộp thoại che */
    lift+=((xmasDlgOn?(w.camera.aspect<1?.2:.34):-.08)-lift)*Math.min(1,dt*4);
    w.camera.position.z+=lift*(w.camera.position.y-.6);
  });
  xmasReady=true;
  const wait=$('#xwait');if(wait)wait.remove();
  xmasMarks();
  if(xmasQuestOn())xmasSpawn();
  mascotSay(xmasProgress().done>=4?'xmas_all_done':'xmas_enter');
}
async function xmasCabin(w,c){
  const objs=await Promise.all(XMAS_CABIN.map(([m])=>w.model(m)));
  if(objs.some(o=>!o))return;
  const g=new w.THREE.Group();
  objs.forEach((o,i)=>{const [,x,y,z,r,flip]=XMAS_CABIN[i];o.position.set(x,y,z);o.rotation.y=r;if(flip)o.scale.x=-1;g.add(o)});
  g.scale.setScalar(2);
  w.group(g,{x:c.x,z:c.z,rotY:c.rotY||0});
  w.obstacles.push(...xmasCabinSolids(c));
}
async function xmasNpcMake(w,p,my){
  const pos=XMAS_MAP.npcs[p.id];
  const obj=p.model?await w.model(p.model):w3Santa(w.THREE);
  if(!obj||my!==xmasGen)return;
  obj.scale.multiplyScalar(XMAS_NPC_SCALE);
  xmasNpcH[p.id]=w.npc(p.id,obj,{x:pos.x,z:pos.z,r:pos.r,rotY:pos.rotY||0});
}
/* đoàn tàu chạy vòng quanh cây thông */
async function xmasTrain(w){
  const cars=[['train-locomotive',0],['train-tender',-.54],['train-wagon',-1.12],['train-wagon',-1.88]];
  const objs=await Promise.all(cars.map(([m])=>w.model(m,{scale:XMAS_TRACK_S})));
  if(objs.some(o=>!o))return;
  let u=0;
  w.onFrame(dt=>{
    u+=dt*1.6;
    objs.forEach((o,i)=>{const p=xmasTrackAt(u+cars[i][1]*XMAS_TRACK_S);o.position.set(p.x,.05,p.z);o.rotation.y=p.rot});
  });
}

/* ============ Thanh việc, nhãn trên đầu, đồ để nhặt ============ */
function xmasBar(){
  const b=$('#xbar');
  if(b){
    const plan=xmasCurPlan(),item=xmasItem(),x=xmasState();
    const cnt=xmasQuestOn()&&xmasStatus(plan.quest)!=='done'?`<span class="xcnt" id="xcnt">${item.icon} ${Math.min(3,x.found.length)}/3</span>`:'';
    b.innerHTML=XMAS_NPCS.map(p=>{const ok=xmasStatus(p.id)==='done';
      return `<button class="xbi${ok?' ok':''}" title="${esc(p.name)}" aria-label="Đi tới ${esc(p.name)}" onclick="xmasGoNpc('${p.id}')">${XMAS_ICON[p.id]}${ok?'<i>✓</i>':''}</button>`}).join('')+cnt;
  }
  const c=$('#xcoin');if(c)c.textContent=`⭐ ${balance()}`;
}
function xmasMarks(){
  const icon=xmasItem().icon;
  XMAS_NPCS.forEach(p=>{
    const st=xmasStatus(p.id),h=xmasNpcH[p.id];
    if(h)h.setMark(st==='done'?'✅':st==='return'?icon:'❗');
  });
  xmasBar();
}
/* sinh đồ ở các chỗ giấu hôm nay chưa nhặt (chỉ khi đã nhận việc và thế giới đã dựng xong) */
function xmasSpawn(){
  const w=xmasWorld;if(!w||!xmasReady||typeof w.pickup!=='function')return;
  const plan=xmasCurPlan(),x=xmasState(),item=xmasItem(),my=xmasGen;
  if(xmasStatus(plan.quest)==='done')return;
  plan.spots.filter(s=>!x.found.includes(s)&&!xmasPicks[s]).forEach(s=>{
    xmasPicks[s]='…';
    w.model(item.model,{scale:1.8}).then(o=>{
      if(!o||my!==xmasGen||xmasWorld!==w)return;
      if(xmasState().found.includes(s)){delete xmasPicks[s];return}
      xmasPicks[s]=w.pickup(s,o,XMAS_SPOTS[s]);
    });
  });
}
/* bé đi tới gần một món đồ */
function xmasFound(spot){
  const plan=xmasCurPlan();
  if(!xmasPickup(spot,plan.day))return false;
  const p=xmasPicks[spot];
  if(p&&p.remove)p.remove();
  delete xmasPicks[spot];
  sfx.ok();mascotSay('xmas_found');
  xmasBar();
  const c=$('#xcnt');
  if(c){burst(c,3,[xmasItem().icon,'✨']);c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}
  if(xmasState().found.length>=3)xmasMarks();
  return true;
}
/* Đi tới (x,z). Không tìm đường: chỉ khi đường thẳng cắt vòng vật cản của cây thông giữa làng
   thì đi qua một điểm vòng bên cạnh cây (phía cho đường ngắn hơn), rồi mới tới đích */
const XMAS_TREE_R=3.8;
function xmasRoute(x,z,stop,done){
  const w=xmasWorld,pl=xmasPlayer;if(!w)return;
  const c=XMAS_TREE,R=XMAS_TREE_R+.3;
  let wp=null;
  if(pl){
    const dx=x-pl.x,dz=z-pl.z,L=Math.hypot(dx,dz)||1;
    const t=Math.max(0,Math.min(1,((c.x-pl.x)*dx+(c.z-pl.z)*dz)/(L*L)));
    if(Math.hypot(pl.x+dx*t-c.x,pl.z+dz*t-c.z)<R){
      const nx=-dz/L,nz=dx/L,Rw=XMAS_TREE_R+1.7;
      const cand=[1,-1].map(k=>({x:c.x+k*nx*Rw,z:c.z+k*nz*Rw}));
      const len=q=>Math.hypot(q.x-pl.x,q.z-pl.z)+Math.hypot(x-q.x,z-q.z);
      wp=len(cand[0])<=len(cand[1])?cand[0]:cand[1];
    }
  }
  /* chặng vòng kẹt thì vẫn thử đi tiếp tới đích (trượt theo mép vật cản) */
  if(wp)w.walkTo(wp.x,wp.z,.3,()=>{if(xmasWorld===w)w.walkTo(x,z,stop,done)});
  else w.walkTo(x,z,stop,done);
}
/* Đi tới nhân vật rồi nói chuyện: đứng bên cạnh (không đứng trước, kẻo búp bê che nhân vật).
   Kẹt mà đã đủ gần thì vẫn nói chuyện; kẹt xa thì Kuromi chỉ cách dùng thanh trên */
function xmasGoNpc(id){
  const w=xmasWorld,n=XMAS_MAP.npcs[id];
  if(!w||!n||xmasDlgOn||!xmasReady)return;
  const pl=xmasPlayer,sx=pl&&pl.x<n.x?-1:1,near=()=>pl&&Math.hypot(pl.x-n.x,pl.z-n.z)<2.2;
  xmasRoute(n.x+sx*1.3,n.z+.3,.2,ok=>{
    if(xmasWorld!==w)return;
    if(ok||near())xmasTalk(id);
    else mascot('think','Bấm vào hình bạn ấy ở thanh trên nha!');
  });
}
function xmasTapped(ev){
  const w=xmasWorld;
  if(!w||xmasDlgOn)return;
  if(ev.kind==='npc')xmasGoNpc(ev.id);
  else if(ev.kind==='pickup')xmasRoute(ev.x,ev.z,0);
  else w.walkTo(ev.x,ev.z);
}

/* ============ Hộp thoại ============ */
/* chuỗi lời nói: chạy nối tiếp, dừng ngay khi có lời mới, bé trả lời, hoặc đóng hộp thoại */
function xmasSpeak(...steps){
  const my=++xmasTok;
  let p=Promise.resolve(steps[0]());
  for(const f of steps.slice(1))p=p.then(()=>my===xmasTok?f():null);
  return p.catch(()=>{});
}
/* nhân vật nói một câu của nhóm: chữ hiện trong hộp thoại (không phải bong bóng của Kuromi) */
function xmasNpcLine(group){
  const {line,done}=voice.line(group);
  const t=$('#xdlg .xsay');if(t)t.textContent=line.text;
  if(xmasSess)xmasSess.say=line.text;
  return done;
}
function xmasDlg(id,{say='',body='',btns=''}={}){
  const d=$('#xdlg');if(!d)return;
  const p=xmasNpc(id);
  xmasDlgOn=true;
  d.innerHTML=`<div class="xbox card3d"><div class="xwho"><span class="xic">${XMAS_ICON[id]}</span><b>${esc(p.name)}</b>
    <button class="xx" onclick="xmasClose()" aria-label="Đóng">✖</button></div>
    <div class="xsay">${esc(say)}</div>${body}${btns?`<div class="row xbtns">${btns}</div>`:''}</div>`;
  d.classList.add('on');
}
function xmasClose(){
  xmasTok++;voice.stop();xmasSess=null;xmasDlgOn=false;
  const d=$('#xdlg');if(d){d.classList.remove('on');d.innerHTML=''}
}
/* sang ngày mới khi đang chơi: tiến độ hôm qua không còn, dựng lại làng cho ngày mới */
function xmasNewDay(){
  const my=xmasGen;
  toast('Sang ngày mới rồi!');
  setTimeout(()=>{if(my===xmasGen)go(xmasVillage)},1500);
}
const XMAS_BYE=`<button class="btn p-pink gloss" onclick="xmasClose()">Tạm biệt 👋</button>`;
function xmasTalk(id){
  if(xmasDlgOn||!xmasNpc(id))return;
  const plan=xmasCurPlan();
  if(plan.day!==dayStr(new Date()))return xmasNewDay();
  const st=xmasStatus(id),item=xmasItem();
  if(st==='done'){
    xmasDlg(id,{btns:XMAS_BYE});
    xmasSpeak(()=>xmasNpcLine(`xmas_${id}_thanks`));
  }else if(st==='quiz')xmasQuizOpen(id,plan);
  else if(st==='quest'){
    const n=xmasState().found.length,on=xmasQuestOn();
    const ask=on?`Bạn tìm được ${n}/3 ${item.name} rồi, tìm tiếp nha!`:`Tìm giúp tớ 3 ${item.name} ${item.icon} nha!`;
    xmasDlg(id,{body:`<div class="xq">${esc(ask)}<button class="xspk" onclick="voice.text(this.parentNode.firstChild.textContent)">🔊</button></div>`,
      btns:`<button class="btn p-green gloss" id="xok" onclick="xmasAccept()">${on?'Đi tìm tiếp!':'Đi tìm!'} ${item.icon}</button>`});
    xmasSpeak(()=>xmasNpcLine(`xmas_${id}_hi`),()=>mascotSay('xmas_quest'),()=>voice.text(ask));
  }else{
    xmasDlg(id,{say:'…'});
    xmasFinish(id,3,plan.day);
  }
}
function xmasAccept(){
  xmasQuestDay=xmasCurPlan().day;
  xmasClose();sfx.click();
  xmasSpawn();xmasBar();
}

/* ---- phiên đố: 3 câu liên tiếp ---- */
function xmasQuizOpen(id,plan){
  const s=xmasSess=xmasQuizNew(id,plan);
  s.tried=[];s.lock=false;s.done=false;s.say='';
  xmasQuizDraw(s);
  const q=s.qs[s.i];
  xmasSpeak(()=>mascotSay('xmas_quiz'),()=>xmasNpcLine(`xmas_${id}_hi`),()=>voice.text(q.q));
}
function xmasQuizDraw(s){
  const q=s.qs[s.i];
  xmasDlg(s.npc,{say:s.say,body:`<div class="xq"><span class="xn">${s.i+1}/${s.qs.length}</span>${esc(q.q)}<button class="xspk" onclick="xmasRead()">🔊</button></div>
    <div class="chs xchs n${q.choices.length}">${q.choices.map((c,i)=>`<button class="ch btn enter" style="--d:${(i*.05).toFixed(2)}s" onclick="xmasChoose(${i})">${esc(c)}</button>`).join('')}</div>`});
}
function xmasRead(){const s=xmasSess;if(s&&s.qs[s.i]){xmasTok++;voice.text(s.qs[s.i].q)}}
const xmasBtn=i=>document.querySelectorAll('#xdlg .ch')[i];
/* bé chọn đáp án i: khoá trong lúc xử lý để bấm đúp không chấm hai lần */
function xmasChoose(i){
  const s=xmasSess;
  if(!s||s.done||s.lock||s.tried.includes(i))return;
  const q=s.qs[s.i];
  if(!q||!(i>=0&&i<q.choices.length))return;
  s.lock=true;xmasTok++;
  const r=xmasQuizAnswer(s,i),b=xmasBtn(i);
  if(!r.ok){
    s.tried.push(i);s.lock=false;
    sfx.bad();if(b)b.classList.add('bad');
    if(r.hint){const c=xmasBtn(q.correct);if(c)c.classList.add('hint');mascotSay('hint')}
    else mascotSay('wrong');
    return;
  }
  sfx.ok();if(b)b.classList.add('good');
  const said=mascotSay('correct');
  /* xong câu 3: cộng sao và lưu ngay (đóng hộp thoại hay rời làng lúc này cũng không mất), chỉ hoãn phần hiển thị */
  let res=null;
  if(r.done){s.done=true;res=xmasComplete(s.npc,r.stars,s.day);if(res)xmasMarks()}
  const my=xmasGen;
  /* chờ Kuromi khen xong (ít nhất XMAS_NEXT_MS, tối đa 2,5 giây) rồi mới sang câu sau */
  voiceWait(said,XMAS_NEXT_MS,Math.max(XMAS_NEXT_MS,2500)).then(()=>{
    if(xmasSess!==s){if(res&&res.bonus>0&&my===xmasGen)xmasParty(res.bonus);return}
    if(r.done){xmasShowDone(s.npc,res,s.day);return}
    s.tried=[];s.lock=false;xmasQuizDraw(s);
    const nq=s.qs[s.i];
    xmasSpeak(()=>voice.text(nq.q));
  });
}

/* ---- xong một việc: cộng sao, cảm ơn, cập nhật nhãn; đủ 4 việc thì ăn mừng ---- */
function xmasFinish(id,stars,day){
  const r=xmasComplete(id,stars,day);
  if(r)xmasMarks();
  xmasShowDone(id,r,day);
}
function xmasParty(n){
  confetti(40);
  burst($('#xbar'),12,['⭐','🎉','🎄','✨']);
  toast(`+${n} ⭐ thưởng hoàn thành!`);
}
/* hiện kết quả một việc đã cộng sao (r từ xmasComplete; null là không cộng được) */
function xmasShowDone(id,r,day){
  xmasSess=null;
  if(!r){
    if(day!==dayStr(new Date())){xmasClose();xmasNewDay()}
    else xmasClose();
    return;
  }
  xmasDlg(id,{body:`<div class="xgain">+${r.stars} ⭐</div>`,btns:XMAS_BYE});
  sfx.win();
  const box=$('#xdlg .xbox');burst(box,8,['⭐','✨']);
  if(r.bonus>0){
    xmasParty(r.bonus);
    xmasSpeak(()=>xmasNpcLine(`xmas_${id}_thanks`),()=>mascotSay('xmas_all_done'));
  }else xmasSpeak(()=>xmasNpcLine(`xmas_${id}_thanks`));
}
