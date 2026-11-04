/* ============ Nói chuyện với Kuromi: nhấn giữ, thu âm, hộp thoại, nối vào trang chủ ============ */
/* Thu ngắn hơn chừng này (ms) thì coi như bé không nói */
const TALK_MIN_MS=600;

/* Phân biệt chạm nhanh (onTap) với nhấn giữ (onHold…onRelease). setT/clearT tiêm vào để test */
function holdGesture({holdMs=350,onHold,onRelease,onTap,setT=setTimeout,clearT=clearTimeout}){
  let timer=0,held=false,down=false;
  const clear=()=>{if(timer){clearT(timer);timer=0}};
  const release=()=>{if(held){held=false;onRelease&&onRelease();return true}return false};
  return{
    down(){if(down)return;down=true;held=false;timer=setT(()=>{timer=0;held=true;onHold&&onHold()},holdMs)},
    up(){if(!down)return;down=false;clear();if(!release())onTap&&onTap()},
    cancel(){if(!down)return;down=false;clear();release()}
  };
}

/* ---- Thu âm: PCM mono bằng Web Audio (iPhone Safari và Chrome Android đều chạy; sau đó mã hoá WAV) ----
   recSeq tăng mỗi lần dừng/huỷ: nếu bé thả tay trong lúc còn đang hỏi quyền micro thì luồng đến muộn bị đóng ngay */
let rec=null,recSeq=0;
function chatRecRelease(r){
  try{r.stream.getTracks().forEach(t=>t.stop())}catch(e){}
  try{r.proc.disconnect();r.src.disconnect()}catch(e){}
  try{r.ctx.close()}catch(e){}
}
async function chatRecStart(){
  chatRecCancel();
  const my=++recSeq;
  const md=navigator.mediaDevices;
  if(!md||!md.getUserMedia)throw new ChatError('mic');
  let stream;
  try{stream=await md.getUserMedia({audio:true})}catch(e){throw new ChatError('mic')}
  if(my!==recSeq){stream.getTracks().forEach(t=>t.stop());return false}
  const AC=window.AudioContext||window.webkitAudioContext;
  try{
    const ctx=new AC();ctx.resume&&ctx.resume();
    const src=ctx.createMediaStreamSource(stream),proc=ctx.createScriptProcessor(4096,1,1),chunks=[];
    proc.onaudioprocess=e=>chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    src.connect(proc);proc.connect(ctx.destination);
    rec={stream,ctx,src,proc,chunks,t0:Date.now()};
    return true;
  }catch(e){stream.getTracks().forEach(t=>t.stop());throw new ChatError('mic')}
}
/* dừng thu: {samples,rate,ms}, null nếu chưa thu được gì */
function chatRecStop(){
  recSeq++;
  const r=rec;if(!r)return null;
  rec=null;chatRecRelease(r);
  const samples=new Float32Array(r.chunks.reduce((n,c)=>n+c.length,0));
  let o=0;r.chunks.forEach(c=>{samples.set(c,o);o+=c.length});
  return{samples,rate:r.ctx.sampleRate,ms:Date.now()-r.t0};
}
function chatRecCancel(){
  recSeq++;
  if(rec){chatRecRelease(rec);rec=null}
}

/* ---- Luồng nói chuyện ---- */
/* Chữ bé vừa nói hiện chừng này (ms) trước khi đổi sang câu trả lời của Kuromi */
let CHAT_HEARD_MS=1200;
/* chatEpoch tăng mỗi khi rời trang chủ: kết quả đến muộn của lượt cũ bị bỏ */
let chatHist=[],chatEpoch=0,chatBusy=false;
const chatMicOK=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
const CHAT_ERR_LINE={format:'talk_unheard',limit:'talk_limit',mic:'talk_nomic'};
function chatListen(on){const i=$('#mimg'),k=i&&i.parentNode;if(k&&k.classList)k.classList.toggle('listening',on)}

/* Bé bắt đầu giữ: kiểm key và số câu còn lại rồi mới thu âm. true = đang thu */
async function chatBegin(){
  if(chatBusy)return false;
  if(!geminiKey()){chatKeyModal();return false}
  if(talkLeft()<=0){mascotSay('talk_limit');chatBuyModal();return false}
  voice.stop();voice.unlock();
  const my=chatEpoch;
  try{
    if(!(await chatRecStart())||my!==chatEpoch)return false;
  }catch(e){chatListen(false);mascotSay('talk_nomic');return false}
  chatListen(true);
  return true;
}
/* Bé thả tay: gửi âm thanh, hiện chữ bé nói rồi chữ trả lời, đọc bằng giọng Gemini */
async function chatEnd(){
  chatListen(false);
  const r=chatRecStop();
  if(!r||r.ms<TALK_MIN_MS)return;
  const my=chatEpoch,alive=()=>my===chatEpoch;
  chatBusy=true;
  mascot('think','…',{hold:true});
  try{
    const wavB64=chatB64(chatEncodeWav(r.samples,r.rate));
    const a=await chatAsk({wavB64,history:chatHist,alive});
    if(!alive())return;
    chatHist=[...chatHist,{role:'user',text:a.heard},{role:'model',text:a.reply}].slice(-TALK_HISTORY*2);
    mascot('think','🗣️ '+a.heard,{hold:true});
    await new Promise(res=>setTimeout(res,CHAT_HEARD_MS));
    if(!alive())return;
    mascot(a.emotion,a.reply,{hold:true});
    await voice.clip(a.wav,a.reply);
    if(alive())mascot(mascotBase);
  }catch(e){
    if(!alive())return;
    const k=e&&e.kind;
    mascotSay(CHAT_ERR_LINE[k]||'talk_error');
    if(k==='key'||k==='nokey')chatKeyModal();
    if(k==='limit')chatBuyModal();
  }finally{if(alive())chatBusy=false}
}
/* Rời trang chủ (go): huỷ thu âm, bỏ kết quả đang chờ */
function chatCancel(){
  chatEpoch++;chatBusy=false;
  chatRecCancel();chatListen(false);
}

/* Trang chủ: nhấn giữ vào ảnh Kuromi để nói; chạm nhanh vẫn là "chọc" như cũ */
function chatAttach(){
  const img=$('#mimg');
  if(!img||!chatMicOK())return;
  const h=holdGesture({onTap:()=>mascotPoke(),onHold:()=>{chatBegin()},onRelease:()=>{chatEnd()}});
  img.onclick=null;
  img.onpointerdown=e=>{e.preventDefault&&e.preventDefault();try{img.setPointerCapture(e.pointerId)}catch(x){}h.down()};
  img.onpointerup=()=>h.up();
  img.onpointercancel=()=>h.cancel();
  img.oncontextmenu=e=>{e.preventDefault();return false};
}
/* Câu hướng dẫn "nhấn giữ vào mình": lần đầu vào trang chủ, rồi cứ 5 lần nhắc lại một lần */
function chatHintDue(){
  if(!chatMicOK())return false;
  const t=talkState();t.hints=(t.hints||0)+1;save();
  return t.hints%5===1;
}

/* ---- Hộp thoại ---- */
/* Hướng tới phụ huynh: bé 5–8 tuổi không tự lấy được khoá. Chỉ hiện 4 ký tự cuối của khoá đang dùng */
function chatKeyModal(onSaved){
  document.querySelectorAll('.modal').forEach(x=>x.remove());
  const cur=geminiKey();
  const m=modalBox(`<h2>🔑 Khoá Gemini</h2>
    <p class="sub">Nhờ ba mẹ nhập khoá Gemini giúp bé để bé nói chuyện với Kuromi nha!</p>
    <p class="sub">Lấy khoá miễn phí ở <b>aistudio.google.com/apikey</b>. Khoá chỉ lưu trên máy này.</p>
    ${cur?`<p class="sub">Đang dùng khoá …${esc(cur.slice(-4))}</p>`:''}
    <input class="inp" id="gk" type="password" autocomplete="off" placeholder="Dán khoá vào đây">
    <div class="row"><button class="btn p-pink gloss" id="gs">Lưu</button>${cur?'<button class="btn p-gray" id="gd">Xoá khoá</button>':''}<button class="btn p-gray" id="gc">Để sau</button></div>`);
  $('#gs').onclick=()=>{
    const v=$('#gk').value.trim();
    if(v.length<20){sfx.bad();return}
    setGeminiKey(v);sfx.ok();m.remove();onSaved&&onSaved();
  };
  const d=$('#gd');if(d)d.onclick=()=>{setGeminiKey('');sfx.click();m.remove()};
  $('#gc').onclick=()=>m.remove();
}
/* Giống bảng phút nghe của Tiệm âm thanh nhưng đơn vị là câu hỏi */
function chatBuyModal(){
  document.querySelectorAll('.modal').forEach(x=>x.remove());
  const m=modalBox(`<h2>💬 Nói chuyện thêm</h2>
    <p class="sub">Mỗi ngày bé được hỏi Kuromi ${TALK_FREE} câu miễn phí. Hôm nay còn <b>${talkLeft()}</b> câu.</p>
    <p class="sub">Đổi sao lấy thêm câu (dùng trong hôm nay) · Bạn đang có <b>${balance()} ⭐</b></p>
    <div class="row">${TALK_PACKS.map((p,i)=>`<button class="btn ${balance()>=p.price?'p-pink gloss':'p-gray'}" id="gb${i}">+${p.n} câu · ${p.price} ⭐</button>`).join('')}</div>
    <div class="row"><button class="btn p-gray" id="gx">Để sau</button></div>`);
  TALK_PACKS.forEach((p,i)=>{$('#gb'+i).onclick=()=>{
    if(!talkBuy(p)){sfx.bad();return}
    sfx.win();confetti(30);m.remove();
  }});
  $('#gx').onclick=()=>m.remove();
}
