/* ============ Giọng Kuromi ============ */
/* Đọc số 0–100 kiểu miền Bắc: hai mươi mốt, hai mươi tư, mười lăm */
const NUM_WORDS=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
function numberWords(n){
  if(!Number.isInteger(n)||n<0||n>100)return String(n);
  if(n<10)return NUM_WORDS[n];
  if(n===100)return 'một trăm';
  const t=Math.floor(n/10),u=n%10;
  const head=t===1?'mười':NUM_WORDS[t]+' mươi';
  if(!u)return head;
  const tail=u===5?'lăm':u===1&&t>1?'mốt':u===4&&t>1?'tư':NUM_WORDS[u];
  return head+' '+tail;
}
/* Chữ hiển thị → chữ để đọc: emoji thành tên, ký hiệu thành chữ, số thành chữ */
function normalizeSpeech(text){
  let s=String(text);
  for(const [e,w] of Object.entries(EMOJI_WORDS))s=s.split(e).join(' '+w+' ');
  s=s.replace(/\+/g,' cộng ').replace(/=/g,' bằng ').replace(/×/g,' nhân ')
    .replace(/\d+/g,d=>' '+numberWords(+d)+' ')
    .replace(/[^\p{L}\s]/gu,' ').toLowerCase();
  return s.split(/\s+/).filter(Boolean).join(' ');
}
/* Chỉ mục mẩu ghép: chuỗi từ → id, gồm PHRASES và mẩu số num_0…num_100 */
let SEG_INDEX=null,SEG_MAX=1;
function segIndex(){
  if(SEG_INDEX)return SEG_INDEX;
  SEG_INDEX=new Map();
  const add=(id,t)=>{const k=normalizeSpeech(t);SEG_INDEX.set(k,id);SEG_MAX=Math.max(SEG_MAX,k.split(' ').length)};
  for(let n=0;n<=100;n++)add('num_'+n,numberWords(n));
  PHRASES.forEach(p=>add(p.id,p.text));
  return SEG_INDEX;
}
/* Ghép câu thành danh sách mẩu (khớp cụm dài nhất trước); còn từ không khớp → null.
   Mỗi cụm chữ số là một mẩu riêng, để "10, 20" không bị đọc dính thành "mười hai mươi" */
function segment(text){
  const idx=segIndex(),out=[];
  for(const part of String(text).split(/(\d+)/)){
    if(/^\d+$/.test(part)){if(+part>100)return null;out.push('num_'+(+part));continue}
    const w=normalizeSpeech(part).split(' ').filter(Boolean);
    for(let i=0;i<w.length;){
      let hit=0;
      for(let n=Math.min(SEG_MAX,w.length-i);n>0;n--){const id=idx.get(w.slice(i,i+n).join(' '));if(id){out.push(id);hit=n;break}}
      if(!hit)return null;
      i+=hit;
    }
  }
  return out.length?out:null;
}

/* ---- Phát giọng: một câu một lúc; câu mới hoặc stop() dừng câu cũ.
   Promise của mỗi câu resolve true nếu nói xong, false nếu bị ngắt ---- */
const VOICE_DIR='audio/voice/';
/* Tốc độ giọng máy dự phòng (phụ huynh chọn) */
const TTS_RATE=1.14;
const SILENT_WAV='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const voice=(()=>{
  let token=0,cur=null,el=null;const last={};
  /* iOS chỉ cho phát phần tử Audio đã được "mở khoá" bằng một lần chạm → dùng lại một phần tử duy nhất */
  const audio=()=>el||(el=new Audio());
  const have=id=>VOICE_FILES.includes(id);
  /* emoji có tên (🍎 → quả táo) được đọc thành chữ, emoji trang trí thì bỏ */
  const words=t=>{let s=String(t);for(const [e,w] of Object.entries(EMOJI_WORDS))s=s.split(e).join(' '+w+' ');return s};
  const plain=t=>words(t).replace(/[\p{Extended_Pictographic}‍️]/gu,'').replace(/\s+/g,' ').trim();
  function finish(ok){if(!cur)return;const c=cur;cur=null;c.resolve(ok)}
  function stop(){
    token++;finish(false);
    if(el){el.onended=el.onerror=null;try{el.pause()}catch(e){}}
    try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}
  }
  /* giọng tiếng Việt có sẵn trên máy (ưu tiên vi-VN); không có thì để trình duyệt tự chọn theo lang */
  function viVoice(){
    try{const vs=speechSynthesis.getVoices?speechSynthesis.getVoices():[];
      return vs.find(x=>/^vi[-_]VN$/i.test(x.lang))||vs.find(x=>/^vi\b/i.test(x.lang))||null}catch(e){return null}
  }
  function tts(text,done){
    if(!window.speechSynthesis){done();return}
    try{
      const u=new SpeechSynthesisUtterance(plain(text));u.lang='vi-VN';u.rate=TTS_RATE;
      /* giữ cao độ tự nhiên: tiếng Việt phân biệt dấu thanh bằng cao độ, ép giọng cao làm "bé" nghe thành "bớ" */
      u.pitch=1;
      const vi=viVoice();if(vi)u.voice=vi;
      u.onend=u.onerror=done;speechSynthesis.speak(u);
    }catch(e){done()}
  }
  /* ids: các mẩu cần phát nối tiếp; thiếu bất kỳ mẩu nào (hoặc file lỗi) → đọc cả câu bằng giọng máy */
  function play(ids,text){
    stop();const my=token;
    return new Promise(resolve=>{
      cur={resolve};
      if(S.voice===false){finish(true);return}
      const done=()=>{if(my===token)finish(true)};
      if(!ids||!ids.length||!ids.every(have)){tts(text,done);return}
      const a=audio();let i=0,failed=false;
      const fail=()=>{if(my!==token||failed)return;failed=true;a.onended=a.onerror=null;tts(text,done)};
      const next=()=>{
        if(my!==token||failed)return;
        if(i>=ids.length){a.onended=a.onerror=null;done();return}
        a.onended=next;a.onerror=fail;a.src=VOICE_DIR+ids[i++]+'.mp3';
        try{const p=a.play();p&&p.catch&&p.catch(fail)}catch(e){fail()}
      };
      next();
    });
  }
  return{
    unlock(){
      try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume&&ac.resume()}catch(e){}
      try{const a=audio();a.src=SILENT_WAV;const p=a.play();p&&p.catch&&p.catch(()=>{})}catch(e){}
    },
    /* chọn ngẫu nhiên một câu của nhóm, không lặp câu vừa nói (không phát) */
    pick(group){
      const arr=LINES[group]||[];
      const pool=arr.length>1?arr.filter(x=>x.id!==last[group]):arr;
      const line=pool[Math.floor(Math.random()*pool.length)];
      if(!line)return{id:'',text:'',emo:'neutral'};
      last[group]=line.id;
      return line;
    },
    line(group){
      const line=this.pick(group);
      return{line,done:line.id?play([line.id],line.text):Promise.resolve(true)};
    },
    busy(){return !!cur},
    text(t){return play(segment(t),t)},
    stop
  };
})();
/* Chờ giọng nói xong nhưng không ít hơn min và không quá max (ms) */
const voiceWait=(p,min,max)=>Promise.all([Promise.race([p,new Promise(r=>setTimeout(r,max))]),new Promise(r=>setTimeout(r,min))]).then(()=>{});
