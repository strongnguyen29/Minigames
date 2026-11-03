/* ============ Tiện ích ============ */
const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=R(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};

/* ============ Lưu trữ (localStorage) ============ */
const KEY='be_vui_hoc_toan_v1';
const DEF={name:'',avatar:'🐱',stars:0,gifts:0,stickers:[],best:{},rounds:0,perfect:0,streak:0,lastDay:'',sound:true,badges:[],spent:0,owned:[]};
let memFallback=null;
function load(){
  try{const s=JSON.parse(localStorage.getItem(KEY));if(s)return Object.assign({},DEF,s)}catch(e){if(memFallback)return memFallback}
  return Object.assign({},DEF,{stickers:[],best:{},badges:[],owned:[]});
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
  if(!S.sound)return;
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
function say(text){
  if(!S.sound||!window.speechSynthesis)return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='vi-VN';u.rate=.85;speechSynthesis.speak(u)}catch(e){}
}
function confetti(n=26){
  const em=['⭐','🎉','✨','🎈','🌟'];
  for(let i=0;i<n;i++){
    const e=document.createElement('div');e.className='fall';e.textContent=pick(em);
    e.style.left=R(0,95)+'vw';e.style.animationDelay=(Math.random()*.6)+'s';e.style.animationDuration=(1.6+Math.random())+'s';
    document.body.appendChild(e);setTimeout(()=>e.remove(),3000);
  }
}

