/* ============ Kuromi: ảnh, cảm xúc, bong bóng lời nói ============ */
const MASCOT_IMG={neutral:'images/mascot/kuromi-neutral.png',happy:'images/mascot/kuromi-happy.png',
  think:'images/mascot/kuromi-think.png',clap:'images/mascot/kuromi-clap.png'};
const MASCOT_BACK_MS=2600;
let mascotTimer=null,mascotBase='neutral';

/* size: lg | md | sm | corner. emo ban đầu là cảm xúc "nền" của màn (Kuromi quay về đó sau khi phản ứng) */
function mascotHTML({emo='neutral',text='',size='lg',extra=''}={}){
  mascotBase=emo;
  return `<div class="kuromi ${size}${extra?' hasbtn':''}"><div class="ped"></div><div class="bub bpop" id="mbub">${esc(text)}</div>${extra}
  <img id="mimg" class="emo-${emo}" src="${MASCOT_IMG[emo]}" alt="Kuromi" draggable="false" onclick="mascotPoke()"></div>`;
}
/* Đổi cảm xúc (và câu trong bong bóng). Không hold thì sau 2,6 giây về cảm xúc nền của màn */
function mascot(emo,text,{hold=false}={}){
  clearTimeout(mascotTimer);mascotTimer=null;
  const img=$('#mimg');if(!img)return;
  img.src=MASCOT_IMG[emo]||MASCOT_IMG.neutral;
  img.className='';void img.offsetWidth;img.className='emo-'+emo;
  if(text!==undefined&&text!==null){const b=$('#mbub');if(b){b.textContent=text;b.classList.remove('bpop');void b.offsetWidth;b.classList.add('bpop')}}
  if(!hold&&emo!==mascotBase)mascotTimer=setTimeout(()=>{mascotTimer=null;mascot(mascotBase)},MASCOT_BACK_MS);
}
/* Kuromi nói một câu của nhóm: đổi cảm xúc theo câu, bong bóng hiện chữ (bubble ghi đè chữ hiển thị).
   ifIdle: nếu đang có câu khác phát (ví dụ lời chào ở màn mở đầu) thì chỉ đổi bong bóng, không cắt ngang */
function mascotSay(group,opts={}){
  const quiet=opts.ifIdle&&voice.busy();
  const {line,done}=quiet?{line:voice.pick(group),done:Promise.resolve(true)}:voice.line(group);
  const txt=opts.bubble!==undefined?opts.bubble:opts.format?opts.format(line.text):line.text;
  mascot(opts.emo||line.emo,txt,opts);
  return done;
}
/* Chỉ cho bong bóng chữ: thay chữ "bạn" đầu tiên bằng tên bé (giọng đọc vẫn nói "bạn") */
const withName=t=>S.name?t.replace(/(^|[^\p{L}])([Bb])ạn(?!\p{L})/u,(m,pre)=>pre+S.name):t;
function mascotReset(){clearTimeout(mascotTimer);mascotTimer=null;mascotBase='neutral'}
/* Hạt (tim, sao…) bay lên từ một phần tử */
function burst(el,n=8,em=['⭐','💜','✨','💖']){
  if(!el)return;
  for(let k=0;k<n;k++){
    const h=document.createElement('span');h.className='heart';h.textContent=em[k%em.length];
    h.style.left=(20+Math.random()*60)+'%';h.style.bottom=(35+Math.random()*30)+'%';h.style.animationDelay=(k*.08)+'s';
    el.appendChild(h);setTimeout(()=>h.remove(),1600);
  }
}
function mascotPoke(){
  const img=$('#mimg');if(!img)return;
  burst(img.parentNode,5,['💜','✨']);
  mascotSay('poke');
}
