/* ============ Tiện ích ============ */
const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=R(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};

/* ============ Lưu trữ (localStorage) ============ */
const KEY='be_vui_hoc_toan_v1';
const DEF={name:'',avatar:'🐱',stars:0,gifts:0,stickers:[],best:{},rounds:0,perfect:0,streak:0,lastDay:'',sound:true,voice:true,sfx:true,badges:[],spent:0,owned:[],luckyGifts:0,giftOwned:[]};
let memFallback=null;
function load(){
  try{const s=JSON.parse(localStorage.getItem(KEY));if(s){
    /* bản cũ chỉ có một nút âm thanh: giọng nói và hiệu ứng lấy theo nút đó */
    if(!('voice' in s))s.voice=s.sfx=s.sound!==false;
    return Object.assign({},DEF,s)}}catch(e){if(memFallback)return memFallback}
  return Object.assign({},DEF,{stickers:[],best:{},badges:[],owned:[],giftOwned:[]});
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){memFallback=S}}
let S=load();
const dayStr=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
function touchStreak(){
  const now=new Date(),t=dayStr(now);
  if(S.lastDay===t)return;
  const y=new Date(now);y.setDate(y.getDate()-1);
  S.streak=(S.lastDay===dayStr(y))?S.streak+1:1;
  S.lastDay=t;save();
}

/* ============ Âm thanh ============ */
let ac;
function tone(f,t,d,type='sine',v=.15){
  if(!S.sfx)return;
  try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(v,ac.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+t+d);
    o.connect(g);g.connect(ac.destination);o.start(ac.currentTime+t);o.stop(ac.currentTime+t+d)}catch(e){}
}
const sfx={
  /* đúng: chuông vui 3 nốt, liên tiếp đúng càng nhiều thì càng cao và thêm nốt lấp lánh */
  ok(combo=0){
    const up=Math.pow(2,Math.min(combo,6)/12);
    [[784,0],[988,.08],[1319,.16]].forEach(([f,t])=>{tone(f*up,t,.22,'triangle',.16);tone(f*up*2,t,.12,'sine',.04)});
    if(combo>=3)tone(2093*up,.28,.25,'sine',.06);
  },
  /* sai: hai nốt trầm đi xuống "bù-bu" */
  bad(){tone(311,0,.18,'sawtooth',.07);tone(220,.16,.32,'sawtooth',.07)},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,i*.13,.25))},
  click(){tone(500,0,.05,'triangle',.1)},
  /* thay váy: chuỗi nốt lấp lánh đi lên như phép thuật */
  magic(){[1047,1319,1568,2093,2637,3136].forEach((f,i)=>{tone(f,i*.06,.3,'sine',.08);tone(f*1.5,i*.06+.03,.15,'triangle',.03)})}
};
/* Nút 🔊 trên cùng: đang bật một trong hai thì tắt cả hai, đang tắt cả hai thì bật cả hai */
function toggleAllSound(){
  const on=!(S.voice||S.sfx);S.voice=S.sfx=on;
  if(!on&&typeof voice!=='undefined')voice.stop();
  save();
}
/* Đọc một câu bằng giọng Kuromi (xem js/voice.js) */
function say(text){return voice.text(text)}
function confetti(n=26){
  const cols=['#ffa6d2','#c79bff','#9fe3ff','#ffd54f','#b7f5c9'];
  for(let i=0;i<n;i++){
    const e=document.createElement('i');e.className='cf';e.style.background=cols[i%cols.length];
    e.style.left=R(0,98)+'vw';e.style.animationDelay=(Math.random()*.6).toFixed(2)+'s';e.style.animationDuration=(1.6+Math.random()*1.2).toFixed(2)+'s';
    document.body.appendChild(e);setTimeout(()=>e.remove(),3500);
  }
}

