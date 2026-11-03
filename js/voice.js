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
