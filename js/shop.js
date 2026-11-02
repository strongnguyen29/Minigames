/* ============ Tiệm công chúa ============ */
/* Thêm loại mới: thêm 1 mục vào SHOP, ảnh để ở images/shop-items/<loại>/<phong cách>/
   Mỗi món: [tên file ảnh, tên hiển thị, giá (số sao)] */
const SHOP_BASE='images/shop-items/';
const SHOP=[
  {id:'dress',icon:'👗',name:'Váy',styles:[
    {id:'chibi',items:[
      ['cong-chua-bong-tuyet.jpg','Công chúa Bông Tuyết',20],
      ['cong-chua-keo-hong.jpg','Công chúa Kẹo Hồng',20],
      ['nu-hoang-mat-ong.jpg','Nữ hoàng Mật Ong',25],
      ['cong-chua-may-trang.jpg','Công chúa Mây Trắng',22],
      ['nu-hoang-bang-gia.jpg','Nữ hoàng Băng Giá',30],
      ['cong-chua-oai-huong.jpg','Công chúa Oải Hương',25],
      ['tien-nu-rung-xanh.jpg','Tiên Nữ Rừng Xanh',30],
      ['co-be-no-hong.jpg','Cô Bé Nơ Hồng',12],
      ['hoang-hau-hong-ngoc.jpg','Hoàng hậu Hồng Ngọc',30],
      ['dau-tay-ngot-ngao.jpg','Dâu Tây Ngọt Ngào',12],
      ['keo-bong-gon.jpg','Kẹo Bông Gòn',12],
      ['banh-kem-xanh-bien.jpg','Bánh Kem Xanh Biển',14],
      ['giot-suong-xanh.jpg','Giọt Sương Xanh',12],
      ['chanh-vang-ti-hon.jpg','Chanh Vàng Tí Hon',12],
      ['da-hoi-phep-mau.jpg','Dạ Hội Phép Màu',22]
    ]},
    {id:'fantasy',items:[
      ['thien-nga-trang.jpg','Thiên Nga Trắng',30],
      ['bau-troi-sao-lap-lanh.jpg','Bầu Trời Sao Lấp Lánh',28],
      ['hoa-dao-mua-xuan.jpg','Hoa Đào Mùa Xuân',24],
      ['canh-buom-hoang-hon.jpg','Cánh Bướm Hoàng Hôn',30],
      ['vu-dieu-hoa-hong.jpg','Vũ Điệu Hoa Hồng',26],
      ['vuong-mien-vang.jpg','Vương Miện Vàng',40],
      ['dao-choi-canh-dong-may.jpg','Dạo Chơi Cánh Đồng Mây',24],
      ['huong-duong-ruc-ro.jpg','Hướng Dương Rực Rỡ',26],
      ['hoa-lam-xoay-tron.jpg','Hoa Lam Xoay Tròn',26],
      ['nu-hoang-hong-phan.jpg','Nữ hoàng Hồng Phấn',36],
      ['thac-nuoc-pha-le.jpg','Thác Nước Pha Lê',36],
      ['hoang-gia-anh-vang.jpg','Hoàng Gia Ánh Vàng',45],
      ['hong-nhung-kieu-sa.jpg','Hồng Nhung Kiêu Sa',32],
      ['buom-tim-oai-huong.jpg','Bướm Tím Oải Hương',28],
      ['cuc-hoa-mi.jpg','Cúc Họa Mi',20],
      ['hong-phan-diu-dang.jpg','Hồng Phấn Dịu Dàng',20]
    ]}
  ]}
];
/* Danh sách phẳng: mỗi món có id = đường dẫn ảnh (ổn định khi thêm món) */
const SHOP_ITEMS=SHOP.flatMap(c=>c.styles.flatMap(st=>st.items.map(([f,name,price])=>({
  id:`${c.id}/${st.id}/${f}`,cat:c.id,style:st.id,price,name,src:`${SHOP_BASE}${c.id}/${st.id}/${f}`}))));
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
  const m=modalBox(`<img class="shopimg big" src="${it.src}" alt="${esc(it.name)}"><p class="sub">${esc(it.name)}</p><div class="row"><button class="btn gray" id="cl">Đóng</button></div>`);
  $('#cl').onclick=()=>m.remove();
}
function selectItem(id){sfx.click();shopSel=id;shop()}
function buyItem(id){
  const it=SHOP_ITEMS.find(x=>x.id===id);
  if(!it||owns(id))return;
  if(balance()<it.price){sfx.bad();return}
  S.spent=(S.spent||0)+it.price;S.owned=[...(S.owned||[]),id];shopSel=id;save();
  sfx.win();confetti(40);
  document.querySelectorAll('.modal').forEach(m=>m.remove());
  shop();
}
/* Popup khi bấm món chưa mua: đủ sao thì cho đổi, thiếu thì gợi ý chơi game */
function lockedItem(id){
  const it=SHOP_ITEMS.find(x=>x.id===id);if(!it||owns(id))return;
  sfx.click();
  const need=it.price-balance(),ok=need<=0;
  const m=modalBox(`<img class="shopimg big locked-preview" src="${it.src}" alt="${esc(it.name)}">
    <h2 style="margin:6px 0">${esc(it.name)}</h2>
    <p class="sub">Giá: <b>${it.price} ⭐</b> · Bé đang có <b>${balance()} ⭐</b></p>
    ${ok?'':`<div class="toast">Bé cần thêm ${need} ⭐ nữa! Chơi game để kiếm sao nhé 🎮</div>`}
    <div class="row">${ok?`<button class="btn" id="buy">🛍️ Đổi ngay</button>`:`<button class="btn alt" id="play">🎮 Chơi game kiếm sao</button>`}<button class="btn gray" id="cl">Để sau</button></div>`);
  $('#cl').onclick=()=>m.remove();
  const b=$('#buy');if(b)b.onclick=()=>buyItem(id);
  const p=$('#play');if(p)p.onclick=()=>{m.remove();sfx.click();home()};
}
function setShopTab(cat){sfx.click();shopCat=cat;shop()}
/* Trộn các phong cách xen kẽ nhau: chibi1, fantasy1, chibi2, fantasy2... */
function interleaveStyles(cat){
  const lists=cat.styles.map(st=>SHOP_ITEMS.filter(x=>x.cat===cat.id&&x.style===st.id&&!owns(x.id)));
  const n=Math.max(...lists.map(l=>l.length));
  return Array.from({length:n},(_,i)=>lists.map(l=>l[i]).filter(Boolean)).flat();
}
function shopStage(it){
  if(!it)return `<div class="stage empty"><div class="stage-msg">👗<br>Chọn một chiếc váy bên phải để đổi nhé!</div></div>`;
  return `<div class="stage"><div class="glow"></div>${SPARKS.map(([x,y],i)=>`<span class="spark" style="left:${x}%;top:${y}%;animation-delay:${(i*.37).toFixed(2)}s">${i%2?'✨':'⭐'}</span>`).join('')}
    <img class="hero" src="${it.src}" alt="${esc(it.name)}" onclick="viewItem('${it.id}')"><div class="pedestal"></div><div class="stage-name">${esc(it.name)}</div></div>`;
}
function shop(){
  const cat=SHOP.find(c=>c.id===shopCat)||SHOP[0];
  const mine=SHOP_ITEMS.filter(x=>x.cat===cat.id&&owns(x.id));
  const locked=interleaveStyles(cat);
  if(!shopSel||!owns(shopSel))shopSel=mine.length?mine[mine.length-1].id:null;
  const cur=SHOP_ITEMS.find(x=>x.id===shopSel);
  const catTabs=SHOP.length>1?`<div class="tabs">${SHOP.map(c=>`<button class="tab ${c.id===cat.id?'sel':''}" onclick="setShopTab('${c.id}')">${c.icon} ${c.name}</button>`).join('')}</div>`:'';
  const ownedList=mine.length?mine.map(it=>`<button class="thumb ${it.id===shopSel?'sel':''}" onclick="selectItem('${it.id}')"><img src="${it.src}" alt="${esc(it.name)}" loading="lazy"></button>`).join(''):`<p class="hint">Chưa có váy nào</p>`;
  const lockList=locked.length?locked.map(it=>`<button class="thumb lockd" onclick="lockedItem('${it.id}')"><img src="${it.src}" alt="${esc(it.name)}" loading="lazy"><span class="tem">🔒</span><span class="price">${it.price} ⭐</span></button>`).join(''):`<p class="hint">Bé đã có hết rồi! 🎉</p>`;
  app.innerHTML=topbar('home()')+`<h2>👑 Tiệm công chúa</h2><p class="sub">Bé có ${balance()} ⭐ · bấm váy có khoá 🔒 để đổi</p>`+catTabs+
    `<div class="shoplayout"><div class="side mine"><h3>👗 Của bé</h3><div class="thumbs">${ownedList}</div></div>${shopStage(cur)}<div class="side"><h3>🔒 Chưa có</h3><div class="thumbs">${lockList}</div></div></div>`;
}
function wardrobe(){
  const mine=SHOP_ITEMS.filter(x=>owns(x.id));
  return `<div class="panel"><h3 style="margin-top:0">Tủ đồ của bé (${mine.length}/${SHOP_ITEMS.length})</h3>${mine.length?
    `<div class="shopgrid small">${mine.map(it=>`<div class="shopitem"><img class="shopimg" src="${it.src}" alt="${esc(it.name)}" loading="lazy" onclick="viewItem('${it.id}')"></div>`).join('')}</div>`:
    `<p class="sub" style="margin:0">Chưa có món nào. Đổi sao ở tiệm nhé! 🛍️</p>`}</div>`;
}
