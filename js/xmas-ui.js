/* Làng Giáng Sinh: dữ liệu bản đồ, nhà gỗ, đoàn tàu và cấu hình giao diện XMAS_UI (giao diện chung ở js/village-ui.js) */

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
async function xmasCabin(w,c){
  const objs=await Promise.all(XMAS_CABIN.map(([m])=>w.model(m)));
  if(objs.some(o=>!o))return;
  const g=new w.THREE.Group();
  objs.forEach((o,i)=>{const [,x,y,z,r,flip]=XMAS_CABIN[i];o.position.set(x,y,z);o.rotation.y=r;if(flip)o.scale.x=-1;g.add(o)});
  g.scale.setScalar(2);
  w.group(g,{x:c.x,z:c.z,rotY:c.rotY||0});
  w.obstacles.push(...xmasCabinSolids(c));
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

/* ============ Cấu hình giao diện làng Noel (dùng js/village-ui.js) ============ */
const XMAS_UI={logic:XMAS_V,
  title:'Làng Giáng Sinh',icon:'🎄',btnCls:'p-green',waitIcon:'❄️',lines:'xmas',
  npcIcons:{santa:'🎅',snowman:'⛄',reindeer:'🦌',nutcracker:'💂'},
  partyIcons:['⭐','🎉','🎄','✨'],
  world:{bound:XMAS_MAP.bound,base:'models/holiday/'},
  map:XMAS_MAP,
  around:{x:XMAS_TREE.x,z:XMAS_TREE.z,r:3.8},   // vòng vật cản của cây thông (gồm cả vòng ray)
  /* cảnh tĩnh: props (model lặp từ 3 lần trở lên thì vẽ bằng InstancedMesh), nhà gỗ, đoàn tàu */
  async build(w){
    const M=XMAS_MAP,by={},jobs=[];
    M.props.forEach(p=>(by[p.model]=by[p.model]||[]).push(p));
    for(const [name,list] of Object.entries(by))jobs.push(list.length>=3?w.instances(name,list):Promise.all(list.map(p=>w.model(name,p))));
    M.cabins.forEach(c=>jobs.push(xmasCabin(w,c)));
    jobs.push(xmasTrain(w));
    await Promise.all(jobs);
  },
  async npcObj(w,p){
    const obj=p.model?await w.model(p.model):w3Santa(w.THREE);
    if(obj)obj.scale.multiplyScalar(XMAS_NPC_SCALE);
    return obj;
  },
  itemObj:async (w,item)=>w.model(item.model,{scale:1.8})};
const xmasHome=()=>vilHome(XMAS_UI);
const xmasVillage=()=>vilVillage(XMAS_UI);
const xmasTalk=id=>vilTalk(id);
