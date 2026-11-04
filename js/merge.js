/* ============ Gộp tiến độ giữa hai máy (không phụ thuộc mạng) ============ */
const DEVICE_KEY='be_vui_device_v1';
const COUNTERS=['stars','rounds','perfect'];
const LOCAL_ONLY=['sound','voice','sfx','music'];
let memDevice=null;
function deviceId(){
  try{let d=localStorage.getItem(DEVICE_KEY);
    if(!d){d=Date.now().toString(36)+Math.random().toString(36).slice(2,10);localStorage.setItem(DEVICE_KEY,d)}
    return d}catch(e){return memDevice||(memDevice=Date.now().toString(36)+Math.random().toString(36).slice(2,10))}
}
const isEmptySave=s=>!s||!s.name;
/* phần của máy dev = tổng hiện có trừ phần các máy khác đã ghi (không âm) */
function foldEarned(s,dev){
  const e=s.earned=s.earned||{};
  const mine=e[dev]=e[dev]||{};
  COUNTERS.forEach(k=>{
    let others=0;
    for(const d in e)if(d!==dev)others+=(e[d]&&e[d][k])||0;
    mine[k]=Math.max(0,(s[k]||0)-others);
  });
  return s;
}
const dayNum=s=>{const m=/^(\d+)-(\d+)-(\d+)$/.exec(s||'');return m?Date.UTC(+m[1],m[2]-1,+m[3])/864e5:-1};
const union=(a,b)=>{const r=[...(a||[])];(b||[]).forEach(x=>{if(!r.includes(x))r.push(x)});return r};
/* base: cặp {gifts,luckyGifts} của lần đồng bộ trước (tuỳ chọn), để gộp quà 3 chiều */
function mergeSave(local,remote,priceOf,base){
  /* trường lạ: lấy cả bản của bên có savedAt lớn hơn, rồi ghi đè các trường có luật riêng */
  const newer=(remote.savedAt||0)>(local.savedAt||0)?remote:local;
  const out=JSON.parse(JSON.stringify(newer));
  /* earned: max từng máy, từng bộ đếm; tổng vào stars/rounds/perfect */
  const earned={};
  [local.earned,remote.earned].forEach(src=>{for(const d in src||{}){
    const t=earned[d]=earned[d]||{};
    COUNTERS.forEach(k=>{t[k]=Math.max(t[k]||0,(src[d]||{})[k]||0)});
  }});
  out.earned=earned;
  COUNTERS.forEach(k=>{out[k]=Object.values(earned).reduce((n,e)=>n+(e[k]||0),0)});
  const best={};
  [local.best,remote.best].forEach(src=>{for(const k in src||{})best[k]=Math.max(best[k]||0,src[k])});
  out.best=best;
  ['stickers','badges','owned','giftOwned'].forEach(k=>{out[k]=union(local[k],remote[k])});
  out.spent=out.owned.filter(id=>!out.giftOwned.includes(id)).reduce((n,id)=>n+(priceOf(id)||0),0);
  /* quà chưa mở: bên nào còn giống base thì chưa đổi, lấy bên kia; cả hai đổi (hoặc không có base) thì bên nhiều hơn thắng */
  const same=x=>!!base&&(x.gifts||0)===(base.gifts||0)&&JSON.stringify(x.luckyGifts||[])===JSON.stringify(base.luckyGifts||[]);
  const g=same(remote)?local:same(local)?remote:(remote.gifts||0)>(local.gifts||0)?remote:local;
  out.gifts=g.gifts||0;out.luckyGifts=[...(g.luckyGifts||[])];
  const dl=dayNum(local.lastDay),dr=dayNum(remote.lastDay);
  if(dl===dr){out.lastDay=local.lastDay||'';out.streak=Math.max(local.streak||0,remote.streak||0)}
  else{const d=dr>dl?remote:local;out.lastDay=d.lastDay||'';out.streak=d.streak||0}
  /* bên chưa có tên luôn thua; còn lại bên mới hơn thắng, bằng thì local */
  const p=!remote.name?local:!local.name?remote:(remote.profileUpdatedAt||0)>(local.profileUpdatedAt||0)?remote:local;
  out.name=p.name;out.avatar=p.avatar;out.profileUpdatedAt=p.profileUpdatedAt||0;
  LOCAL_ONLY.forEach(k=>{if(k in local)out[k]=local[k];else delete out[k]});
  out.savedAt=Math.max(local.savedAt||0,remote.savedAt||0);
  return out;
}
