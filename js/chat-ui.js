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
  if(my!==recSeq){stream.getTracks().forEach(t=>t.stop());return}
  const AC=window.AudioContext||window.webkitAudioContext;
  try{
    const ctx=new AC();ctx.resume&&ctx.resume();
    const src=ctx.createMediaStreamSource(stream),proc=ctx.createScriptProcessor(4096,1,1),chunks=[];
    proc.onaudioprocess=e=>chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    src.connect(proc);proc.connect(ctx.destination);
    rec={stream,ctx,src,proc,chunks,t0:Date.now()};
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
