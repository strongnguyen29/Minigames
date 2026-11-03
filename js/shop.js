/* ============ Tiệm công chúa ============ */
/* Ảnh ở images/shop-items/fashion/: items/<tên>.jpg là ảnh váy (thumb),
   characters-cutout/<tên>.webp là nhân vật mặc váy đã tách nền (sân khấu).
   Mỗi món: [tên ảnh váy (không đuôi), tên hiển thị, giá (số sao), tên ảnh nhân vật nếu khác tên váy]
   (vài ảnh váy bị đặt nhầm tên nên được ghép với nhân vật theo hình) */
const SHOP_BASE='images/shop-items/fashion/';
const SHOP_BG='images/shop-items/bg/'; // ảnh nền toàn trang theo từng phong cách
const SHOP=[
  {id:'gown',icon:'👑',name:'Dạ hội',bg:'palace',items:[
    ['gold-princess-gown','Công chúa Vàng Óng',45],
    ['gold-white-ball-gown','Dạ hội Trắng Vàng',40],
    ['purple-princess-gown','Công chúa Tím Mộng Mơ',40],
    ['blue-floral-ao-dai','Dạ hội Xanh Biển',35,'blue-ball-gown'],
    ['blue-casual-set','Dạ hội Hồng Phấn',35,'pink-ball-gown'],
    ['purple-tiered-gown','Váy Tím Nhiều Tầng',32]
  ]},
  {id:'dress',icon:'👗',name:'Váy xinh',bg:'garden',items:[
    ['pink-dress','Váy Hồng Nơ Xinh',15],
    ['beige-dress','Váy Be Dịu Dàng',15],
    ['lavender-dress','Váy Oải Hương',15],
    ['sage-green-dress','Váy Xanh Lá Mạ',15],
    ['blue-ball-gown','Váy Xanh Nơ Lớn',18,'light-blue-dress'],
    ['pink-sailor-dress','Váy Thủy Thủ Hồng',18],
    ['light-blue-ruffle-dress','Váy Bèo Xanh Nhạt',25],
    ['golden-ruffle-dress','Váy Bèo Vàng Nắng',25],
    ['pink-ball-gown','Váy Bèo Hồng',25,'pink-ruffle-dress']
  ]},
  {id:'aodai',icon:'🏮',name:'Áo dài',bg:'temple',items:[
    ['pink-ao-dai','Áo dài Hồng Đào',22],
    ['yellow-ao-dai','Áo dài Vàng Hoa Mai',22],
    ['white-floral-ao-dai','Áo dài Trắng Hoa Nhí',22],
    ['blue-embroidered-traditional-set','Áo dài Xanh Hoa Đào',22,'blue-floral-ao-dai'],
    ['red-ao-dai','Áo dài Đỏ Ngày Tết',25,'red-ao-dai-01']
  ]},
  {id:'uniform',icon:'🎒',name:'Đồng phục',bg:'school',items:[
    ['navy-sailor-uniform','Thủy Thủ Xanh Than',16],
    ['light-blue-sailor-uniform','Thủy Thủ Xanh Nhạt',16],
    ['pink-cardigan-uniform','Áo Len Hồng',16],
    ['beige-blazer-uniform','Vest Be Học Trò',18],
    ['burgundy-blazer-uniform','Vest Đỏ Mận',18],
    ['gray-blazer-uniform','Vest Xám Tinh Nghịch',18],
    ['navy-blazer-uniform','Vest Xanh Than',18]
  ]},
  {id:'casual',icon:'🧢',name:'Dạo phố',bg:'playground',items:[
    ['pink-cap-set','Mũ Lưỡi Trai Hồng',12],
    ['lavender-cap-set','Mũ Lưỡi Trai Tím',12],
    ['yellow-casual-set','Dạo Phố Vàng Chanh',12],
    ['navy-sailor-set','Dạo Phố Xanh Dương',12,'blue-casual-set'],
    ['mint-casual-set','Dạo Phố Bạc Hà',12]
  ]}
];
/* Danh sách phẳng: id = fashion/<tên ảnh váy> (ổn định khi thêm món) */
const SHOP_ITEMS=SHOP.flatMap(c=>c.items.map(([f,name,price,ch])=>({
  id:`fashion/${f}`,cat:c.id,price,name,thumb:`${SHOP_BASE}items/${f}.jpg`,src:`${SHOP_BASE}characters-cutout/${ch||f}.webp`})));
/* Bỏ món đã mua thuộc tiệm cũ (ảnh không còn dùng) và hoàn lại sao cho bé */
(()=>{
  const owned=(S.owned||[]).filter(id=>SHOP_ITEMS.some(x=>x.id===id));
  if(owned.length===(S.owned||[]).length)return;
  S.owned=owned;S.spent=owned.reduce((a,id)=>a+SHOP_ITEMS.find(x=>x.id===id).price,0);save();
})();
const balance=()=>Math.max(0,S.stars-(S.spent||0));
const owns=id=>(S.owned||[]).includes(id);
let shopCat=SHOP[0].id;

let shopSel=null; // id món đang đứng giữa sân khấu
const SPARKS=[[12,18],[84,12],[8,58],[90,52],[22,86],[78,84],[50,6]];

function modalBox(html){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="box">${html}</div>`;
  document.body.appendChild(m);
  m.onclick=e=>{if(e.target===m)m.remove()};
  return m;
}
function viewItem(id){
  const it=SHOP_ITEMS.find(x=>x.id===id);if(!it)return;
  sfx.click();
  const m=modalBox(`<img class="shopimg big cutout" src="${it.src}" alt="${esc(it.name)}"><p class="sub">${esc(it.name)}</p><div class="row"><button class="btn gray" id="cl">Đóng</button></div>`);
  $('#cl').onclick=()=>m.remove();
}
/* Kéo váy ở "Của bé" thả vào sân khấu để thay (dùng pointer nên chạy cả chuột lẫn cảm ứng) */
function dragDress(e,id){
  if(e.button>0)return;
  const th=e.currentTarget,x0=e.clientX,y0=e.clientY;let ghost=null;
  const over=(x,y)=>{const r=$('.stage')?.getBoundingClientRect();return !!r&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom};
  const move=ev=>{
    if(!ghost){
      if(Math.hypot(ev.clientX-x0,ev.clientY-y0)<8)return;
      ghost=document.createElement('img');ghost.className='drag-ghost';ghost.src=th.querySelector('img').src;
      document.body.appendChild(ghost);th.classList.add('dragging');$('.stage')?.classList.add('drop-ready');
    }
    ev.preventDefault();
    ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';
    $('.stage')?.classList.toggle('drop-hover',over(ev.clientX,ev.clientY));
  };
  const end=ev=>{
    removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);
    th.classList.remove('dragging');$('.stage')?.classList.remove('drop-ready','drop-hover');
    if(!ghost){if(ev.type==='pointerup')dragHint(th);return}
    if(ev.type==='pointerup'&&over(ev.clientX,ev.clientY)){ghost.remove();wearItem(id);return}
    /* thả ra ngoài: váy bay về chỗ cũ */
    const r=th.getBoundingClientRect();ghost.classList.add('back');
    ghost.style.left=r.left+r.width/2+'px';ghost.style.top=r.top+r.height/2+'px';
    setTimeout(()=>ghost.remove(),300);
  };
  addEventListener('pointermove',move,{passive:false});addEventListener('pointerup',end);addEventListener('pointercancel',end);
}
/* Bấm mà không kéo: lắc váy và nhắc bé kéo vào khung */
function dragHint(th){
  sfx.click();
  th.classList.remove('nudge');void th.offsetWidth;th.classList.add('nudge');
  mascotSay('shop_drag');
}
/* Rải lấp lánh bay ra từ giữa sân khấu */
function magicBurst(st){
  const em=['✨','⭐','💖','🌟','💫'];
  for(let i=0;i<18;i++){
    const a=i/18*Math.PI*2,d=110+Math.random()*90,e=document.createElement('span');
    e.className='burst';e.textContent=em[i%em.length];
    e.style.setProperty('--dx',Math.cos(a)*d+'px');e.style.setProperty('--dy',Math.sin(a)*d+'px');
    e.style.animationDelay=(Math.random()*.12).toFixed(2)+'s';
    st.appendChild(e);setTimeout(()=>e.remove(),1200);
  }
}
let swapping=false;
/* Thay váy: nhân vật cũ xoáy sao biến mất, nhân vật mới bừng sáng hiện ra */
function wearItem(id){
  const it=SHOP_ITEMS.find(x=>x.id===id),st=$('.stage');
  if(!it||!st||swapping)return;
  if(id===shopSel){sfx.click();const h=st.querySelector('.hero');h?.classList.remove('hop');void h?.offsetWidth;h?.classList.add('hop');return}
  swapping=true;shopSel=id;sfx.magic();
  document.querySelectorAll('.side.mine .thumb').forEach(b=>b.classList.toggle('sel',b.dataset.id===id));
  const img=new Image();img.src=it.src;
  const ready=img.decode().catch(()=>{});
  st.classList.add('swap');
  st.insertAdjacentHTML('beforeend',`<div class="swirl">${Array.from({length:10},(_,i)=>`<span style="--a:${i*36}deg">${i%2?'✨':'⭐'}</span>`).join('')}</div>`);
  setTimeout(async()=>{
    await ready;
    const cur=$('.stage');if(!cur){swapping=false;return}
    cur.outerHTML=shopStage(it).replace('class="stage"','class="stage swapin"');
    const nw=$('.stage');nw.insertAdjacentHTML('afterbegin','<div class="flash"></div>');magicBurst(nw);
    swapping=false;mascotSay('shop_wear');
  },500);
}
function buyItem(id){
  const it=SHOP_ITEMS.find(x=>x.id===id);
  if(!it||owns(id))return;
  if(balance()<it.price){sfx.bad();return}
  S.spent=(S.spent||0)+it.price;S.owned=[...(S.owned||[]),id];shopSel=id;save();
  sfx.win();confetti(40);
  document.querySelectorAll('.modal').forEach(m=>m.remove());
  shop(true);
  mascotSay('shop_buy');const k=$('.kuromi');burst(k,8,['⭐','💖','✨']);
}
/* Popup khi bấm món chưa mua: đủ sao thì cho đổi, thiếu thì gợi ý chơi game */
function lockedItem(id){
  const it=SHOP_ITEMS.find(x=>x.id===id);if(!it||owns(id))return;
  sfx.click();
  const need=it.price-balance(),ok=need<=0;
  if(!ok)mascotSay('shop_poor',{format:t=>`Cần ${it.price} ⭐ nha! ${t}`});
  const m=modalBox(`<img class="shopimg big locked-preview" src="${it.thumb}" alt="${esc(it.name)}">
    <h2 style="margin:6px 0">${esc(it.name)}</h2>
    <p class="sub">Giá: <b>${it.price} ⭐</b> · Bé đang có <b>${balance()} ⭐</b></p>
    ${ok?'':`<div class="toast">Bé cần thêm ${need} ⭐ nữa! Chơi game để kiếm sao nhé 🎮</div>`}
    <div class="row">${ok?`<button class="btn p-pink gloss" id="buy">🛍️ Đổi ngay</button>`:`<button class="btn p-blue" id="play">🎮 Chơi game kiếm sao</button>`}<button class="btn p-gray" id="cl">Để sau</button></div>`);
  $('#cl').onclick=()=>m.remove();
  const b=$('#buy');if(b)b.onclick=()=>buyItem(id);
  const p=$('#play');if(p)p.onclick=()=>{m.remove();sfx.click();go(home)};
}
function setShopTab(cat){sfx.click();shopCat=cat;shop(true)}
function shopStage(it){
  if(!it)return `<div class="stage empty"><div class="stage-msg">👗<br>Chọn một bộ đồ bên phải để đổi nhé!</div></div>`;
  return `<div class="stage"><div class="glow"></div>${SPARKS.map(([x,y],i)=>`<span class="spark" style="left:${x}%;top:${y}%;animation-delay:${(i*.37).toFixed(2)}s">${i%2?'✨':'⭐'}</span>`).join('')}
    <img class="hero" src="${it.src}" alt="${esc(it.name)}" onclick="viewItem('${it.id}')"><div class="pedestal"></div><div class="stage-name">${esc(it.name)}</div></div>`;
}
/* Nền toàn trang: đổi tab thì nền mới mờ dần đè lên nền cũ */
let shopBgLoaded=false;
function shopBackdrop(prev){
  if(!shopBgLoaded){shopBgLoaded=true;SHOP.forEach(c=>{new Image().src=`${SHOP_BG}${c.bg}.jpg`})}
  const nw=$('.shopbg');
  if(!prev||!nw)return;
  if(prev.dataset.bg===nw.dataset.bg)return; // ảnh đã có sẵn trong cache, hiện ngay
  prev.classList.remove('fadein');nw.classList.add('fadein');nw.before(prev);
  setTimeout(()=>prev.remove(),600);
}
/* quiet: vẽ lại tiệm (đổi tab, vừa mua) mà Kuromi không chào lại */
function shop(quiet){
  const cat=SHOP.find(c=>c.id===shopCat)||SHOP[0];
  const mine=SHOP_ITEMS.filter(x=>x.cat===cat.id&&owns(x.id));
  const locked=SHOP_ITEMS.filter(x=>x.cat===cat.id&&!owns(x.id));
  if(!shopSel||!owns(shopSel))shopSel=mine.length?mine[mine.length-1].id:null;
  const cur=SHOP_ITEMS.find(x=>x.id===shopSel);
  const catTabs=SHOP.length>1?`<div class="atabs stabs">${SHOP.map(c=>`<button class="atab ${c.id===cat.id?'sel':''}" onclick="setShopTab('${c.id}')">${c.icon} ${c.name}</button>`).join('')}</div>`:'';
  const ownedList=mine.length?mine.map(it=>`<button class="thumb drag ${it.id===shopSel?'sel':''}" data-id="${it.id}" onpointerdown="dragDress(event,'${it.id}')"><img src="${it.thumb}" alt="${esc(it.name)}" loading="lazy" draggable="false"></button>`).join(''):`<p class="hint">Chưa có bộ nào</p>`;
  const lockList=locked.length?locked.map(it=>`<button class="thumb lockd" onclick="lockedItem('${it.id}')"><img src="${it.thumb}" alt="${esc(it.name)}" loading="lazy"><span class="tem">🔒</span><span class="price">${it.price} ⭐</span></button>`).join(''):`<p class="hint">Bé đã có hết rồi! 🎉</p>`;
  const prev=[...document.querySelectorAll('.shopbg')].pop();
  app.innerHTML=`<div class="shopbg" data-bg="${cat.bg}" style="background-image:url('${SHOP_BG}${cat.bg}.jpg')"></div>
  <div class="scr shop nomascot"><main class="mainc">
    <div class="ttl glass"><button class="back" onclick="goTap(this,home)">⬅️</button>👑 Tiệm công chúa<span class="coin">⭐ ${balance()}</span></div>${catTabs}
    <div class="shopl"><div class="side mine"><h3>👗 Kéo để mặc</h3><div class="thumbs">${ownedList}</div></div>${shopStage(cur)}<div class="side"><h3>🔒 Chưa có</h3><div class="thumbs">${lockList}</div></div></div>
  </main>${mascotHTML({emo:'neutral',size:'corner'})}</div>`;
  shopBackdrop(prev);
  if(!quiet)mascotSay('shop_hello');
}
/* Tab "Tủ váy" của Bộ sưu tập */
function wardrobe(){
  const mine=SHOP_ITEMS.filter(x=>owns(x.id));
  return mine.length?`<div class="wd">${mine.map((it,i)=>`<img class="enter" style="--d:${(i*.04).toFixed(2)}s" src="${it.thumb}" alt="${esc(it.name)}" loading="lazy" onclick="viewItem('${it.id}')">`).join('')}</div>`
    :`<p class="empty">Chưa có bộ váy nào. Đổi sao ở tiệm công chúa nhé! 🛍️</p>`;
}
