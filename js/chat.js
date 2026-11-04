/* ============ Nói chuyện với Kuromi: hạn mức câu hỏi, ví sao, máy khách Gemini ============ */
/* Mỗi ngày được hỏi miễn phí TALK_FREE câu (tính riêng từng máy); hết thì đổi sao lấy thêm câu, dùng trong ngày */
const TALK_FREE=10;
const TALK_PACKS=[{n:5,price:5},{n:15,price:12}];

/* Câu hỏi trên máy này: used = số câu miễn phí đã dùng hôm nay, paid = số câu đã đổi sao còn lại */
function talkState(){
  let t=S.talk;
  if(!t||typeof t!=='object')t=S.talk={day:'',used:0,paid:0};
  const d=dayStr(new Date());
  if(t.day!==d){t.day=d;t.used=0;t.paid=0}
  return t;
}
const talkLeft=()=>{const t=talkState();return Math.max(0,TALK_FREE-t.used)+Math.max(0,t.paid||0)};
/* trừ một câu: miễn phí trước rồi tới câu đã đổi */
function talkUse(){
  const t=talkState();
  if(t.used<TALK_FREE)t.used++;else t.paid=Math.max(0,(t.paid||0)-1);
  save();
}
/* sao đã tiêu cho câu hỏi trên mọi máy (balance() trừ phần này) */
const talkSpent=()=>Object.values(S.talkSpent||{}).reduce((n,v)=>n+(v||0),0);
function talkBuy(pack){
  if(balance()<pack.price)return false;
  const d=deviceId(),ts=Object.assign({},S.talkSpent);ts[d]=(ts[d]||0)+pack.price;S.talkSpent=ts;
  talkState().paid+=pack.n;save();
  return true;
}
