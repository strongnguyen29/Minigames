/* ============ Nói chuyện với Kuromi: hạn mức câu hỏi, ví sao, máy khách Gemini ============ */
/* Mỗi ngày được hỏi miễn phí TALK_FREE câu (tính riêng từng máy); hết thì đổi sao lấy thêm câu, dùng trong ngày */
const TALK_FREE=10;
const TALK_PACKS=[{n:5,price:5},{n:15,price:12}];

const TALK_MAX_REPLY=300;
const TALK_EMOS=['neutral','happy','think','clap'];

/* ---- Trả lời của Gemini: JSON {heard,reply,emotion}; hỏng hoặc reply rỗng thì null ---- */
function chatParse(raw){
  let o;
  try{o=JSON.parse(String(raw).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g,''))}catch(e){return null}
  if(!o||typeof o!=='object'||typeof o.reply!=='string')return null;
  const reply=o.reply.trim().slice(0,TALK_MAX_REPLY);
  if(!reply)return null;
  return{heard:typeof o.heard==='string'?o.heard.trim():'',reply,emotion:TALK_EMOS.includes(o.emotion)?o.emotion:'neutral'};
}

/* ---- Âm thanh: WAV 16-bit mono (Gemini nhận WAV; Safari và Chrome thu PCM giống nhau) ---- */
function chatPcmToWav(pcm,rate){
  const w=new Uint8Array(44+pcm.length),dv=new DataView(w.buffer);
  const tag=(o,s)=>{for(let i=0;i<4;i++)w[o+i]=s.charCodeAt(i)};
  tag(0,'RIFF');dv.setUint32(4,36+pcm.length,true);tag(8,'WAVE');tag(12,'fmt ');
  dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
  dv.setUint32(24,rate,true);dv.setUint32(28,rate*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);
  tag(36,'data');dv.setUint32(40,pcm.length,true);w.set(pcm,44);
  return w;
}
function chatEncodeWav(samples,rate){
  const pcm=new Uint8Array(samples.length*2),dv=new DataView(pcm.buffer);
  samples.forEach((x,i)=>{const s=Math.max(-1,Math.min(1,x));dv.setInt16(i*2,s<0?s*32768:s*32767,true)});
  return chatPcmToWav(pcm,rate);
}
function chatB64(bytes){
  let s='';
  for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
  return btoa(s);
}
const chatFromB64=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0));

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
