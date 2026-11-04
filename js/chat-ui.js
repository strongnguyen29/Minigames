/* ============ Nói chuyện với Kuromi: nhấn giữ, thu âm, hộp thoại, nối vào trang chủ ============ */
/* Thu ngắn hơn chừng này (ms) thì coi như bé không nói */
const TALK_MIN_MS=600;
/* Thu tối đa chừng này giây (giữ lâu hơn thì phần sau bị bỏ): giữ yêu cầu gửi Gemini nhỏ, không vượt giới hạn 20 MB */
let TALK_MAX_S=20;

/* Biết khi nào bé ngừng nói. push(rms, ms) cho từng đoạn âm thanh dài ms (tính theo mẫu thật, không theo đồng hồ):
   'stop' = bé đã nói rồi im đủ silenceMs, hoặc đã tới maxMs; 'nospeech' = quá noSpeechMs mà chưa nghe tiếng nói */
function chatVad({speechRms=0.02,silenceMs=1500,noSpeechMs=8000,maxMs=TALK_MAX_S*1000}={}){
  let t=0,spoke=false,quiet=0;
  return{push(rms,ms){
    t+=ms;
    if(rms>=speechRms){spoke=true;quiet=0}else if(spoke)quiet+=ms;
    if(t>=maxMs||(spoke&&quiet>=silenceMs))return'stop';
    if(!spoke&&t>=noSpeechMs)return'nospeech';
    return null;
  }};
}

/* ---- Thu âm: PCM mono bằng Web Audio (iPhone Safari và Chrome Android đều chạy; sau đó mã hoá WAV) ----
   recSeq tăng mỗi lần dừng/huỷ: nếu bé thả tay trong lúc còn đang hỏi quyền micro thì luồng đến muộn bị đóng ngay */
let rec=null,recSeq=0;
function chatRecRelease(r){
  try{r.stream.getTracks().forEach(t=>t.stop())}catch(e){}
  try{r.proc.disconnect();r.src.disconnect()}catch(e){}
  try{r.ctx.close()}catch(e){}
}
/* onAuto('stop'|'nospeech') được gọi một lần khi bé ngừng nói / không nói gì; onChunk(Float32Array, tần số) cho mỗi đoạn thu (truyền liên tục cho Live) */
async function chatRecStart({onAuto,onChunk}={}){
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
    let total=0,fired=false;
    const vad=chatVad();
    proc.onaudioprocess=e=>{
      if(total>=ctx.sampleRate*TALK_MAX_S)return;
      const c=new Float32Array(e.inputBuffer.getChannelData(0));total+=c.length;chunks.push(c);
      onChunk&&onChunk(c,ctx.sampleRate);
      const rms=Math.sqrt(c.reduce((a,x)=>a+x*x,0)/(c.length||1));
      const r=vad.push(rms,c.length/ctx.sampleRate*1000);
      if(r&&!fired){fired=true;onAuto&&onAuto(r)}
    };
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
/* đang thu âm (nhạc nền dùng để hạ âm lượng, khỏi lọt vào micro) */
const chatRecording=()=>!!rec;
function chatRecCancel(){
  recSeq++;
  if(rec){chatRecRelease(rec);rec=null}
}

/* ---- Luồng nói chuyện ---- */
/* Chữ bé vừa nói hiện chừng này (ms) trước khi đổi sang câu trả lời của Kuromi */
let CHAT_HEARD_MS=1200;
/* chatEpoch tăng mỗi khi rời trang chủ: kết quả đến muộn của lượt cũ bị bỏ.
   chatState: idle (chưa làm gì) → listening (đang nghe) → thinking (chờ Gemini, đọc trả lời) → idle */
let chatHist=[],chatEpoch=0,chatState='idle';
/* Đường chính là Gemini Live (nghe và nói trực tiếp, xem js/live.js); lỗi trước khi có tiếng thì rơi về chat + TTS (chatAsk).
   chatLive = phiên Live của lượt đang chạy; chatLiveAudio = Live đã bắt đầu nói */
let chatUseLive=true,chatLive=null,chatLiveAudio=false;
const chatMicOK=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
const CHAT_ERR_LINE={format:'talk_unheard',limit:'talk_limit',mic:'talk_nomic'};
function chatListen(on){const i=$('#mimg'),k=i&&i.parentNode;if(k&&k.classList)k.classList.toggle('listening',on)}

/* Nút là icon nền trong suốt (bong bóng thoại + sóng âm, chấm tròn góc trên) kèm dòng chữ nhỏ bên cạnh; CSS chỉ hiện
   dòng chữ từ tablet trở lên (điện thoại chỉ có icon, đã có giọng Kuromi hướng dẫn). Đặt trong khung Kuromi: trên đầu
   nhân vật ở PC/tablet ngang, cạnh nhân vật ở màn dọc/điện thoại. Trạng thái thể hiện bằng class:
   listening = các vạch sóng âm nhảy + màu hồng; thinking = các vạch nhấp nhô chậm */
const CHAT_BTN_LABEL={idle:'Trò chuyện với Kuromi',listening:'Đang nghe, chạm để gửi',thinking:'Kuromi đang nghĩ'};
const CHAT_BTN_TEXT={idle:'Trò chuyện với Kuromi nhé!',listening:'Kuromi đang nghe… chạm để gửi',thinking:'Kuromi đang nghĩ…'};
const CHAT_ICON=`<svg viewBox="0 0 256 256" fill="none" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path class="sb" d="M156 28A104 104 0 0 0 54 202L24 236L89 224A104 104 0 0 0 232 128"/>
<circle class="dot" cx="205" cy="52" r="20"/>
<path class="bar b1" d="M75 116V136"/><path class="bar b2" d="M102 90V162"/><path class="bar b3" d="M128 76V176"/>
<path class="bar b4" d="M154 90V162"/><path class="bar b5" d="M181 116V136"/></svg>`;
const chatBtnHTML=()=>`<button class="talkbtn" id="talkbtn" onclick="chatToggle()" aria-label="${CHAT_BTN_LABEL.idle}">${CHAT_ICON}<span class="tt" id="talktxt">${CHAT_BTN_TEXT.idle}</span></button>`;
function chatSet(state){
  chatState=state;
  const b=$('#talkbtn');if(!b)return;
  b.classList.toggle('listening',state==='listening');
  b.classList.toggle('thinking',state==='thinking');
  b.setAttribute('aria-label',CHAT_BTN_LABEL[state]);
  const t=$('#talktxt');if(t)t.textContent=CHAT_BTN_TEXT[state];
}

/* Chạm nút: lần 1 bắt đầu nghe, lần 2 gửi sớm; đang chờ Gemini thì bỏ qua */
async function chatToggle(){
  if(chatState==='listening'){await chatEnd();return}
  if(chatState!=='idle')return;
  await chatBegin();
}
/* Bắt đầu nghe: kiểm key và số câu còn lại rồi mới thu âm (và mở phiên Live song song). true = đang thu */
async function chatBegin(){
  if(chatState!=='idle')return false;
  if(!geminiKey()){chatKeyModal();return false}
  if(talkLeft()<=0){mascotSay('talk_limit');chatBuyModal();return false}
  voice.stop();voice.unlock();
  const my=chatEpoch;
  chatSet('listening');
  chatLiveAudio=false;
  chatLive=chatUseLive&&typeof liveOpen==='function'?liveOpen({key:geminiKey(),
    onAudioStart:()=>{if(my===chatEpoch)chatLiveStarted()},
    onText:t=>{if(my===chatEpoch)mascot('happy',t,{hold:true})}}):null;
  const live=chatLive;
  try{
    const started=await chatRecStart({
      onAuto:r=>{if(my===chatEpoch)r==='stop'?chatEnd():chatNoSpeech()},
      onChunk:(c,rate)=>{if(live&&!chatLiveAudio)live.sendPcm(liveDownsample(c,rate))}
    });
    if(!started||my!==chatEpoch){
      if(my===chatEpoch){chatSet('idle');chatLiveClose()}
      return false;
    }
  }catch(e){chatListen(false);chatSet('idle');chatLiveClose();mascotSay('talk_nomic');return false}
  chatListen(true);
  return true;
}
/* Đóng phiên Live đang mở (nếu có) */
function chatLiveClose(){const l=chatLive;chatLive=null;chatLiveAudio=false;if(l)l.close()}
/* Live bắt đầu nói (server tự nhận ra bé ngừng nói): nếu còn đang nghe thì dừng thu và chuyển sang chờ */
function chatLiveStarted(){
  chatLiveAudio=true;
  mascot('happy','…',{hold:true});
  if(chatState==='listening')chatEnd();
}
/* Bé im suốt từ đầu: bỏ thu âm, nhắc nói lại */
function chatNoSpeech(){
  chatRecCancel();chatListen(false);chatSet('idle');chatLiveClose();
  mascotSay('talk_unheard');
}
/* Bé nói xong: gửi cho Live (hoặc đường cũ nếu Live lỗi trước khi có tiếng), hiện chữ và đọc câu trả lời */
async function chatEnd(){
  if(chatState!=='listening')return;
  chatListen(false);
  const r=chatRecStop(),live=chatLive;
  /* chưa thu được gì / quá ngắn (chạm nhầm): quay về chờ */
  if(!r||r.ms<TALK_MIN_MS){chatLiveClose();chatSet('idle');return}
  /* giữ lâu mà không có mẫu nào = micro không gửi dữ liệu (hay gặp trên iPhone): báo ba mẹ */
  if(!r.samples.length){chatLiveClose();chatSet('idle');mascotSay('talk_nomic');return}
  if(r.samples.length/r.rate*1000<TALK_MIN_MS){chatLiveClose();chatSet('idle');return}
  const my=chatEpoch,alive=()=>my===chatEpoch;
  chatSet('thinking');
  mascot('think','…',{hold:true});
  try{
    let done=false;
    if(live){
      try{await chatLiveTurn(live,alive);done=true}
      catch(e){
        /* huỷ, khoá sai, hết câu hoặc Live đã nói dở thì không rơi về đường cũ */
        if(!alive()||chatLiveAudio||['key','limit','cancelled'].includes(e&&e.kind))throw e;
      }
    }
    if(!done&&alive())await chatSendOld(r,alive);
  }catch(e){
    if(!alive())return;
    const k=e&&e.kind;
    mascotSay(CHAT_ERR_LINE[k]||'talk_error');
    if(k==='key'||k==='nokey')chatKeyModal();
    if(k==='limit')chatBuyModal();
  }finally{if(alive()){chatSet('idle');chatLive=null;chatLiveAudio=false}}
}
/* Đường Live: chờ Kuromi nói xong rồi mới trừ một câu (chỉ khi bé còn ở trang chủ) */
async function chatLiveTurn(live,alive){
  if(!chatLiveAudio)live.endAudio();
  await live.turn;
  if(!alive())return;
  talkUse();
  mascot(mascotBase);
}
/* Đường dự phòng: chat nhận âm thanh rồi TTS (js/chat.js); hiện chữ bé nói rồi chữ trả lời */
async function chatSendOld(r,alive){
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
}
/* Rời trang chủ (go): huỷ thu âm, đóng phiên Live, bỏ kết quả đang chờ */
function chatCancel(){
  chatEpoch++;chatState='idle';
  chatLiveClose();chatRecCancel();chatListen(false);
}
/* đang thu âm hoặc đang phát tiếng Live: nhạc nền hạ âm lượng để khỏi lọt vào micro / lấn tiếng Kuromi */
const chatAudioBusy=()=>!!rec||!!(chatLive&&chatLive.speaking&&chatLive.speaking());

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
