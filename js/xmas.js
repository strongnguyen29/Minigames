/* Làng Giáng Sinh 3D: logic ngày, trạng thái S.xmas, sao và phiên đố (không đụng DOM) */
const XMAS_NPCS=[
  {id:'santa',name:'Ông già Noel',model:null},
  {id:'snowman',name:'Người tuyết',model:'snowman-hat'},
  {id:'reindeer',name:'Tuần lộc',model:'reindeer'},
  {id:'nutcracker',name:'Lính chì',model:'nutcracker'}
];
const XMAS_ITEMS=[
  {id:'present',model:'present-a-cube',name:'hộp quà',icon:'🎁'},
  {id:'sock',model:'sock-red',name:'chiếc tất Noel',icon:'🧦'},
  {id:'candy',model:'candy-cane-red',name:'cây kẹo gậy',icon:'🍬'},
  {id:'cookie',model:'gingerbread-man',name:'bánh gừng',icon:'🍪'},
  {id:'flake',model:'snowflake-a',name:'bông tuyết',icon:'❄️'},
  {id:'wreath',model:'wreath-decorated',name:'vòng nguyệt quế',icon:'🎀'}
];
/* 14 chỗ giấu: tạm đặt trên vòng tròn bán kính 8 (toạ độ chốt ở Task 6) */
const XMAS_SPOTS=Array.from({length:14},(_,i)=>({x:+(8*Math.cos(i/14*Math.PI*2)).toFixed(2),z:+(8*Math.sin(i/14*Math.PI*2)).toFixed(2)}));

/* mulberry32: bộ số ngẫu nhiên tất định theo hạt */
function xmasRng(seed){
  let a=seed>>>0;
  return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
}
/* xáo Fisher-Yates bằng rng cho trước, trả mảng mới */
function xmasShuffle(arr,rng){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

/* kế hoạch của một ngày: chỉ phụ thuộc vào chuỗi ngày, mọi máy ra giống nhau */
function xmasPlan(day){
  const n=dayNum(day),rng=xmasRng(n);
  /* kho xáo một lần bằng hạt cố định, mỗi ngày lấy 9 câu kế tiếp (không lặp đến khi hết kho) */
  const order=xmasShuffle(XMAS_QUIZ.map((_,i)=>i),xmasRng(20261224));
  const start=(((n*9)%order.length)+order.length)%order.length;
  const quest=XMAS_NPCS[Math.floor(rng()*XMAS_NPCS.length)].id;
  const item=XMAS_ITEMS[Math.floor(rng()*XMAS_ITEMS.length)].id;
  const spots=xmasShuffle(XMAS_SPOTS.map((_,i)=>i),rng).slice(0,3);
  const quiz={};
  let k=0;
  XMAS_NPCS.filter(p=>p.id!==quest).forEach(p=>{
    quiz[p.id]=[0,1,2].map(()=>{
      const o=XMAS_QUIZ[order[(start+k++)%order.length]];
      /* xáo thứ tự đáp án để đáp án đúng không dồn một vị trí */
      const idx=xmasShuffle(o.c.map((_,i)=>i),rng);
      return {id:o.id,q:o.q,choices:idx.map(i=>o.c[i]),correct:idx.indexOf(o.a)};
    });
  });
  return {day,quest,item,spots,quiz};
}

const xmasFresh=day=>({day,done:[],found:[],bonus:false});
function xmasState(){
  const t=dayStr(new Date());
  if(!S.xmas||S.xmas.day!==t){S.xmas=xmasFresh(t);save()}
  return S.xmas;
}
function xmasStatus(npcId){
  const x=xmasState();
  if(x.done.includes(npcId))return 'done';
  const plan=xmasPlan(x.day);
  if(plan.quest!==npcId)return 'quiz';
  return x.found.length>=3?'return':'quest';
}
function xmasPickup(spot,day){
  const x=xmasState();
  if(day!==x.day)return false;
  if(!xmasPlan(day).spots.includes(spot)||x.found.includes(spot))return false;
  x.found.push(spot);save();return true;
}
function xmasComplete(npcId,stars,day){
  const x=xmasState();
  if(day!==x.day||x.done.includes(npcId))return null;
  x.done.push(npcId);
  S.stars+=stars;
  let bonus=0;
  if(x.done.length>=4&&!x.bonus){x.bonus=true;bonus=3;S.stars+=3}
  touchStreak();save();
  return {stars,bonus};
}
const xmasProgress=()=>({done:xmasState().done.length,total:4});
const xmasQuizStars=m=>m<=0?3:m===1?2:1;

function xmasQuizNew(npcId,plan){
  return {npc:npcId,qs:plan.quiz[npcId],i:0,mistakes:0,wrongHere:0,day:plan.day};
}
function xmasQuizAnswer(sess,idx){
  const q=sess.qs[sess.i];
  if(idx!==q.correct){
    sess.mistakes++;sess.wrongHere++;
    return {ok:false,hint:sess.wrongHere>=2,next:false,done:false};
  }
  sess.i++;sess.wrongHere=0;
  const done=sess.i>=sess.qs.length;
  return done?{ok:true,hint:false,next:false,done:true,stars:xmasQuizStars(sess.mistakes)}
             :{ok:true,hint:false,next:true,done:false};
}

/* Bộ đồ đi chơi làng: mặc định là váy trắng, thêm các váy bé đã mua; bộ đang mặc lưu theo máy */
const XMAS_OUTFIT_KEY='be_vui_xmas_outfit_v1';
const XMAS_DEFAULT_OUTFIT={id:'default',name:'Váy Trắng',src:'images/shop-items/fashion/characters-cutout/white-dress.webp'};
function xmasOutfits(){
  const owned=S.owned||[];
  return [XMAS_DEFAULT_OUTFIT].concat(SHOP_ITEMS.filter(x=>owned.includes(x.id)).map(x=>({id:x.id,name:x.name,src:x.src})));
}
function xmasOutfit(){
  let id=null;
  try{id=localStorage.getItem(XMAS_OUTFIT_KEY)}catch(e){}
  return xmasOutfits().find(o=>o.id===id)||XMAS_DEFAULT_OUTFIT;
}
function xmasSetOutfit(id){try{localStorage.setItem(XMAS_OUTFIT_KEY,id)}catch(e){}}
