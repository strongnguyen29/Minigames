/* Logic dùng chung cho các làng 3D (Noel, Tết): kế hoạch ngày, trạng thái S[field], sao, phiên đố, bộ đồ (không đụng DOM) */

/* mulberry32: bộ số ngẫu nhiên tất định theo hạt */
function vilRng(seed){
  let a=seed>>>0;
  return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
}
/* xáo Fisher-Yates bằng rng cho trước, trả mảng mới */
function vilShuffle(arr,rng){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
const vilQuizStars=m=>m<=0?3:m===1?2:1;
function vilQuizAnswer(sess,idx){
  const q=sess.qs[sess.i];
  if(idx!==q.correct){
    sess.mistakes++;sess.wrongHere++;
    return {ok:false,hint:sess.wrongHere>=2,next:false,done:false};
  }
  sess.i++;sess.wrongHere=0;
  const done=sess.i>=sess.qs.length;
  return done?{ok:true,hint:false,next:false,done:true,stars:vilQuizStars(sess.mistakes)}
             :{ok:true,hint:false,next:true,done:false};
}

/* cfg = {id, field, npcs:[{id,name,me?,you?}] (me/you: cách xưng hô trong lời nhờ tìm đồ, mặc định tớ/Bạn), items:[{id,...}], spots:[{x,z}], quiz:()=>kho câu, seed}
   Luôn đọc S lúc gọi hàm (S bị gán lại khi tải từ mây), không giữ tham chiếu. */
function makeVillage(cfg){
  const per=3,need=cfg.npcs.length,perDay=(need-1)*per;
  const V={id:cfg.id,field:cfg.field,npcs:cfg.npcs,items:cfg.items,spots:cfg.spots};
  /* kế hoạch của một ngày: chỉ phụ thuộc vào chuỗi ngày, mọi máy ra giống nhau */
  V.plan=day=>{
    const bank=cfg.quiz();
    const n=dayNum(day),rng=vilRng(n);
    /* kho xáo một lần bằng hạt cố định, mỗi ngày lấy perDay câu kế tiếp (không lặp đến khi hết kho) */
    const order=vilShuffle(bank.map((_,i)=>i),vilRng(cfg.seed));
    const start=(((n*perDay)%order.length)+order.length)%order.length;
    const quest=cfg.npcs[Math.floor(rng()*cfg.npcs.length)].id;
    const item=cfg.items[Math.floor(rng()*cfg.items.length)].id;
    const spots=vilShuffle(cfg.spots.map((_,i)=>i),rng).slice(0,3);
    const quiz={};
    let k=0;
    cfg.npcs.filter(p=>p.id!==quest).forEach(p=>{
      quiz[p.id]=[0,1,2].map(()=>{
        const o=bank[order[(start+k++)%order.length]];
        /* xáo thứ tự đáp án để đáp án đúng không dồn một vị trí */
        const idx=vilShuffle(o.c.map((_,i)=>i),rng);
        return {id:o.id,q:o.q,choices:idx.map(i=>o.c[i]),correct:idx.indexOf(o.a)};
      });
    });
    return {day,quest,item,spots,quiz};
  };
  V.fresh=day=>({day,done:[],found:[],bonus:false});
  V.state=()=>{
    const t=dayStr(new Date());
    if(!S[cfg.field]||S[cfg.field].day!==t){S[cfg.field]=V.fresh(t);save()}
    return S[cfg.field];
  };
  V.status=npcId=>{
    const x=V.state();
    if(x.done.includes(npcId))return 'done';
    const plan=V.plan(x.day);
    if(plan.quest!==npcId)return 'quiz';
    return x.found.length>=3?'return':'quest';
  };
  V.pickup=(spot,day)=>{
    const x=V.state();
    if(day!==x.day)return false;
    if(!V.plan(day).spots.includes(spot)||x.found.includes(spot))return false;
    x.found.push(spot);save();return true;
  };
  V.complete=(npcId,stars,day)=>{
    const x=V.state();
    if(day!==x.day||x.done.includes(npcId))return null;
    x.done.push(npcId);
    S.stars+=stars;
    let bonus=0;
    if(x.done.length>=need&&!x.bonus){x.bonus=true;bonus=3;S.stars+=3}
    touchStreak();save();
    return {stars,bonus};
  };
  V.progress=()=>({done:V.state().done.length,total:need});
  V.quizNew=(npcId,plan)=>({npc:npcId,qs:plan.quiz[npcId],i:0,mistakes:0,wrongHere:0,day:plan.day});
  return V;
}

/* Bộ đồ đi chơi làng (chung các làng): mặc định là váy trắng, thêm các váy bé đã mua; bộ đang mặc lưu theo máy */
const VIL_OUTFIT_KEY='be_vui_xmas_outfit_v1';
const VIL_DEFAULT_OUTFIT={id:'default',name:'Váy Trắng',src:'images/shop-items/fashion/characters-cutout/white-dress.webp'};
function vilOutfits(){
  const owned=S.owned||[];
  return [VIL_DEFAULT_OUTFIT].concat(SHOP_ITEMS.filter(x=>owned.includes(x.id)).map(x=>({id:x.id,name:x.name,src:x.src})));
}
function vilOutfit(){
  let id=null;
  try{id=localStorage.getItem(VIL_OUTFIT_KEY)}catch(e){}
  return vilOutfits().find(o=>o.id===id)||VIL_DEFAULT_OUTFIT;
}
function vilSetOutfit(id){try{localStorage.setItem(VIL_OUTFIT_KEY,id)}catch(e){}}
