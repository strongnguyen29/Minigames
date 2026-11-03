/* ============ Cảnh nền và khung màn hình ============ */
/* Mây trôi, lâu đài phía xa, sao lấp lánh */
function sceneHTML(){
  return `<div class="scene"><i class="cloud c1"></i><i class="cloud c2"></i><i class="cloud c3"></i><div class="castle"></div>
  <span class="sp s1">✦</span><span class="sp s2">✦</span><span class="sp s3">✦</span><span class="sp s4">✦</span></div>`;
}
/* Khung chung: cột Kuromi bên trái (nếu có) + nội dung bên phải */
function screenHTML({mascot,top='',body='',cls=''}={}){
  const col=mascot?`<aside class="mcol ${mascot.size||'lg'}">${mascotHTML(mascot)}</aside>`:'';
  return `<div class="scr ${cls}${mascot?'':' nomascot'}">${sceneHTML()}${col}<main class="mainc">${top}${body}</main></div>`;
}
/* Thanh trên: ⬅️ · avatar + tên (mở cài đặt) · ⭐ · 🎁 · 🔊 */
function topbar(back){
  return `<div class="top">${back?`<button class="back" onclick="goTap(this,()=>{${back}})">⬅️</button>`:''}
  <button class="me" onclick="settings()"><span class="av">${S.avatar}</span><span class="nm">${esc(S.name||'Bạn')}</span></button>
  <span class="coin" onclick="goTap(this,shop)" title="Số sao (bấm để vào tiệm)">⭐ ${balance()}</span>
  <span class="coin" onclick="goTap(this,album)" title="Hộp quà">🎁 ${S.gifts}</span>
  <button class="snd" onclick="toggleAllSound();this.textContent=S.voice||S.sfx?'🔊':'🔇'">${S.voice||S.sfx?'🔊':'🔇'}</button></div>`;
}
