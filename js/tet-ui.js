/* Làng Tết: dữ liệu bản đồ (chợ Tết ở giữa) và cấu hình giao diện TET_UI (giao diện chung ở js/village-ui.js, model ở js/tet-models.js) */

/* ============ Bản đồ làng (dữ liệu cố định) ============
   Trục x sang phải, z về phía camera (xuống dưới màn hình). Nhà và vật to đặt sát rìa bắc,
   vì phía sau vật cao (bắc) bị che khi nhìn từ camera nghiêng 50°. */
const TET_MARKET={x:0,z:-2.4};            // tâm vòng bao chợ Tết (5 sạp hình chữ U mở về nam)
const TET_MAP=(()=>{
  const bound={rx:24,rz:16},props=[];
  const P=(kind,x,z,o={})=>props.push(Object.assign({kind,x:+x.toFixed(2),z:+z.toFixed(2),rotY:0,scale:1,solid:0},o));
  /* chợ Tết: 3 sạp dãy sau quay về nam, 2 sạp hai bên chéo vào trong; dây đèn lồng nối các sạp */
  const st=1.25;   // sạp phóng to để chợ là chỗ nổi nhất làng
  P('stall',-3,-4.9,{goods:'fruit',scale:st,solid:1.3});P('stall',0,-5.1,{goods:'lantern',scale:st,solid:1.3});P('stall',3,-4.9,{goods:'banh',scale:st,solid:1.3});
  P('stall',-4.7,-1.7,{goods:'flower',rotY:.9,scale:st,solid:1.3});P('stall',4.7,-1.7,{goods:'couplet',rotY:-.9,scale:st,solid:1.3});
  P('lanternString',0,-3.4,{len:6});P('lanternString',0,.4,{len:8.4});
  /* cổng chào ở nam: hai cột là hai vật cản nhỏ, lối giữa rộng */
  P('gate',0,12);
  /* ông đồ cạnh cổng: bàn thấp có giấy đỏ */
  P('desk',-6.2,10.5,{rotY:.3,solid:.6});
  /* bắc: hai nhà mái ngói sát rìa, nồi bánh chưng và chồng bánh trước nhà trái, bàn thờ trong hiên nhà phải */
  P('house',-8,-13,{solid:2.2});P('house',8,-13,{solid:2.2});
  P('pot',-8.6,-9.9,{scale:1.3,solid:.7});P('banhStack',-6.9,-10,{scale:1.3,solid:.5});
  P('altar',8,-11.95,{scale:1.1});
  /* tây: vườn đào xen mai */
  [[-18.5,-2.6],[-14.8,-4.4],[-20.5,1.6],[-12.8,-2.4]].forEach(([x,z])=>P('peach',x,z,{solid:.45}));
  [[-17.4,-6],[-19.6,4.6],[-12.2,4.8]].forEach(([x,z])=>P('apricot',x,z,{solid:.45}));
  /* đông: sân khấu múa lân */
  P('stage',16,-2.4,{solid:1.7});
  /* rìa làng: hai vòng cây xanh xen tre, nằm ngoài biên */
  const rng=vilRng(127);
  for(const [gap,n,big] of [[1.8,60,1.1],[5,52,1.4]])for(let i=0;i<n;i++){
    const a=(i+(gap>2?.5:0))/n*Math.PI*2,south=Math.sin(a)>.3;
    const kind=i%3===1?'bamboo':'tree';
    P(kind,Math.cos(a)*(bound.rx+gap+rng()),Math.sin(a)*(bound.rz+gap+rng()),{rotY:rng()*6,scale:south?.75+rng()*.2:big+rng()*.3});
  }
  /* chậu quất và đèn lồng cột rải trong làng */
  [[-7.6,11.6],[3.3,11.2],[-6.8,-.2],[6.8,-.2],[-10.6,-12],[-5.4,-12],[5.4,-12],[10.6,-12],[12.5,-1.2],[19.6,-1.2],[-9,6.6],[9.5,2]]
    .forEach(([x,z],i)=>P('kumquat',x,z,{rotY:i,solid:.35}));
  [[-3,7.5],[3,7.5],[-9.5,-.8],[9.5,-.8],[0,-9.5],[-13,8],[13,7.5],[-3.6,-11.5],[3.6,-11.5]].forEach(([x,z])=>P('postLantern',x,z,{solid:.25}));
  /* đường đá bước chân nối các khu. Gạch kit có gốc ở góc ô (x -1..0, z 0..1) nên dời gốc theo góc xoay để tâm viên đá nằm đúng điểm */
  const stone=(x,z)=>{const r=Math.floor(rng()*4)*Math.PI/2,k=.8;
    P('floor-stone',x+k*(.5*Math.cos(r)-.5*Math.sin(r)),z-k*(.5*Math.sin(r)+.5*Math.cos(r)),{rotY:r,scale:k})};
  const lane=(x1,z1,x2,z2)=>{const n=Math.round(Math.hypot(x2-x1,z2-z1)/1.4);for(let i=0;i<=n;i++)stone(x1+(x2-x1)*i/n,z1+(z2-z1)*i/n)};
  lane(0,4.2,0,13.5);lane(-7,.6,-14.5,1.2);lane(7,.6,14.5,1.4);lane(-3.6,-7.6,-7.2,-9.8);lane(3.6,-7.6,7.2,-9.8);
  return {bound,start:{x:0,z:13.6},props,
    /* meet: chỗ búp bê xuất hiện khi vào làng, ngay dưới bên phải nhân vật để vừa vào đã thấy nhân vật và dấu ❗ */
    npcs:{ongdo:{x:-5,z:10,r:.45,meet:{x:-3.4,z:13}},seller:{x:0,z:2.5,r:.45,meet:{x:1.8,z:5.2}},
      lion:{x:16,z:.4,r:.5,meet:{x:17.8,z:3.4}},goat:{x:-16,z:0,r:.4,meet:{x:-14.4,z:2.6}}}};
})();

/* bàn thấp của ông đồ: mặt gỗ, giấy đỏ, nghiên mực (dựng bằng khối, theo bảng màu của kit) */
function tetDesk(THREE,kit){
  const g=new THREE.Group(),C=kit.C,mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8,flatShading:true});
  const box=(w,h,d,c,x,y,z,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.rotation.y=ry;g.add(m)};
  box(1.3,.08,.7,C.wood,0,.4,0);
  for(const x of [-.55,.55])for(const z of [-.25,.25])box(.08,.38,.08,C.woodDk||C.wood,x,.19,z);
  box(.42,.012,.55,C.red,-.3,.45,0,.15);box(.42,.012,.55,C.red,.22,.45,.02,-.1);
  box(.16,.05,.12,0x222222,.5,.47,-.2);
  return g;
}
/* đèn lồng cột: cột gỗ, tay treo, đèn lồng đỏ có chóp vàng */
function tetPostLantern(THREE,kit){
  const g=new THREE.Group(),C=kit.C,mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8,flatShading:true});
  const add=(geo,c,x,y,z,s)=>{const m=new THREE.Mesh(geo,mat(c));m.position.set(x,y,z);if(s)m.scale.set(...s);g.add(m);return m};
  add(new THREE.CylinderGeometry(.05,.07,2.2,6),C.wood,0,1.1,0);
  add(new THREE.BoxGeometry(.5,.05,.05),C.wood,.2,2.1,0);
  add(new THREE.SphereGeometry(1,8,6),C.red,.4,1.72,0,[.24,.3,.24]);
  for(const y of [1.45,1.99])add(new THREE.CylinderGeometry(.12,.12,.06,8),C.gold,.4,y,0);
  return g;
}
/* kit dựng một lần cho mỗi thế giới (material dùng chung trong kit) */
const tetKitOf=w=>w._tetKit||(w._tetKit=tetKit(w.THREE));

/* ============ Cấu hình giao diện làng Tết (dùng js/village-ui.js) ============ */
const TET_UI={logic:TET_V,
  title:'Làng Tết',icon:'🧧',btnCls:'p-pink',waitIcon:'🏮',lines:'tet',
  npcIcons:{ongdo:'👴',seller:'👩',lion:'🦁',goat:'🐐'},
  partyIcons:['🧧','🎉','🌸','✨'],
  world:{bound:TET_MAP.bound,base:'models/holiday/',sky:0xbfe3ff,ground:0x9fd36b,particles:'petals'},
  map:TET_MAP,
  around:{x:TET_MARKET.x,z:TET_MARKET.z,r:4.8},   // vòng bao cả chợ Tết, đường đi vòng qua chợ
  /* cảnh tĩnh: vật lặp từ 3 lần trở lên vẽ bằng InstancedMesh; vật có userData.tick thì cho chạy theo khung hình */
  async build(w){
    const T=w.THREE,kit=tetKitOf(w),by={},jobs=[];
    TET_MAP.props.forEach(p=>(by[p.kind]=by[p.kind]||[]).push(p));
    const make=p=>p.kind==='stall'?kit.stall(p.goods):p.kind==='lanternString'?kit.lanternString(p.len):p.kind==='gate'?kit.gate(TET_YEAR.sign)
      :p.kind==='desk'?tetDesk(T,kit):p.kind==='postLantern'?tetPostLantern(T,kit):kit[p.kind]();
    /* sân chợ lát màu be dưới các sạp, cho chợ nổi lên là chỗ giữa làng */
    const plaza=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshLambertMaterial({color:0xead9a8}));
    plaza.rotation.x=-Math.PI/2;plaza.position.set(TET_MARKET.x,.012,TET_MARKET.z+.6);plaza.scale.set(7,6.2,1);w.scene.add(plaza);
    for(const [kind,list] of Object.entries(by)){
      if(kind==='floor-stone'){jobs.push(w.instances(kind,list));continue}
      if(list.length>=3&&!['stall','lanternString'].includes(kind)){jobs.push(w.instances(make(list[0]),list));continue}
      for(const p of list){
        const o=make(p);o.scale.setScalar(p.scale||1);
        w.group(o,{x:p.x,z:p.z,rotY:p.rotY,solid:p.solid});
        if(o.userData.tick)w.onFrame((dt,t)=>o.userData.tick(t));
      }
    }
    /* cổng chào: hai cột là hai vật cản riêng, chừa lối đi ở giữa */
    for(const p of by.gate||[])for(const s of [-1,1])w.obstacles.push({x:p.x+s*2.1,z:p.z,r:.35});
    await Promise.all(jobs);
  },
  /* nhân vật Tết đã dựng đúng cỡ (≈ 1.33), không phóng thêm */
  async npcObj(w,p){const k=tetKitOf(w);return typeof k[p.id]==='function'?k[p.id]():null},
  /* đồ để tìm: phóng to cho dễ thấy, cỡ tương đương đồ làng Noel */
  itemObj:async (w,item)=>{const o=tetKitOf(w).item(item.id);o.scale.setScalar(1.5);return o}};
const tetHome=()=>vilHome(TET_UI);
const tetVillage=()=>vilVillage(TET_UI);
const tetTalk=id=>vilTalk(id);

/* nhạc nền riêng của làng Tết */
if(typeof music!=='undefined'&&typeof radioUrl==='function')music.theme('vil-tet',radioUrl({file:'songs/xuan-sum-vay.mp3'}));
