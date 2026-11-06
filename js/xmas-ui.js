/* Làng Giáng Sinh: màn chọn đồ và (tạm) màn làng */
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
/* Tạm: Task 6 thay bằng làng 3D */
function xmasVillage(){
  app.innerHTML=screenHTML({mascot:{emo:'happy',size:'sm'},cls:'xmas-village',
    top:`<div class="ttl"><button class="back" onclick="goTap(this,xmasHome)">⬅️</button>🎄 Làng Giáng Sinh</div>`,
    body:`<div class="xwait">Đang dựng làng…</div>`});
}
