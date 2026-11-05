/* ============ Công chúa chăm ngoan: nhiệm vụ, chu kỳ, báo xong và chấm sao ============ */
const CHORE_GROUPS=[{id:'sang',icon:'🌅',name:'Buổi sáng'},{id:'truong',icon:'🏫',name:'Ở trường'},{id:'chieu',icon:'🏠',name:'Chiều tối'},{id:'toi',icon:'🌙',name:'Trước khi ngủ'}];
/* Id được lưu trong dữ liệu của bé: không đổi. school:true = chỉ có ngày đi học (T2–T6) */
const CHORES=[
  {id:'day_dung_gio',name:'Dậy đúng giờ',icon:'⏰',grp:'sang'},
  {id:'danh_rang_sang',name:'Tự giác đánh răng, rửa mặt',icon:'🪥',grp:'sang'},
  {id:'mac_do',name:'Tự mặc đồ',icon:'👗',grp:'sang'},
  {id:'an_sang',name:'Tự ăn sáng',icon:'🥣',grp:'sang'},
  {id:'deo_cap',name:'Tự đeo cặp, đi giày dép',icon:'🎒',grp:'sang'},
  {id:'chao_di',name:'Chào ông bà, bố mẹ trước khi đi học',icon:'👋',grp:'sang'},
  {id:'di_hoc',name:'Đi học đúng giờ',icon:'🚌',grp:'sang',school:true},
  {id:'o_truong',name:'Ở trường ngoan',icon:'🏫',grp:'truong',school:true},
  {id:'an_trua',name:'Ăn hết phần ăn trưa',icon:'🍱',grp:'truong',school:true},
  {id:'chao_ve',name:'Chào ông bà, bố mẹ khi đi học về',icon:'🏡',grp:'chieu',school:true},
  {id:'cat_cap',name:'Tự cất cặp, giày dép đúng chỗ',icon:'👟',grp:'chieu'},
  {id:'rua_tay',name:'Rửa tay trước khi ăn',icon:'🧼',grp:'chieu'},
  {id:'giup_viec',name:'Giúp bố mẹ việc nhỏ (dọn bát, lau bàn, nhặt rau)',icon:'🧹',grp:'chieu'},
  {id:'an_toi',name:'Ăn hết cơm tối, ăn đủ rau thịt trong 30 phút',icon:'🍚',grp:'chieu'},
  {id:'hoc_bai',name:'Học bài / đọc sách / tập viết',icon:'📚',grp:'chieu'},
  {id:'don_do_choi',name:'Dọn đồ chơi sau khi chơi',icon:'🧸',grp:'chieu'},
  {id:'danh_rang_toi',name:'Đánh răng buổi tối',icon:'🦷',grp:'toi'},
  {id:'soan_sach',name:'Tự soạn sách vở, quần áo cho ngày mai',icon:'📒',grp:'toi',school:true},
  {id:'di_ngu',name:'Đi ngủ trước 10 giờ 15',icon:'😴',grp:'toi'}
];
const CHORES_WEEK=[
  {id:'tuan_dung_gio',name:'Cả tuần không đi học muộn',icon:'🕗'},
  {id:'tuan_don_goc',name:'Tự dọn góc học tập / kệ đồ chơi',icon:'🗂️'},
  {id:'tuan_doc_truyen',name:'Đọc xong 1 cuốn truyện',icon:'📖'},
  {id:'tuan_hoc_tho',name:'Học thuộc 1 bài thơ / bài hát',icon:'🎶'}
];
const CHORES_EXTRA=[{id:'diem10',name:'Đạt điểm 10',icon:'💯'},{id:'vuot_thi',name:'Vượt qua 1 kỳ thi',icon:'🏆'}];
/* bấm đúp "Con xong rồi!" cho việc đột xuất trong chừng này ms thì chỉ tính một lần */
const EXTRA_DEBOUNCE_MS=2000;
/* chỉ số đếm (cho huy hiệu) cộng thêm khi chấm xong một việc */
const CHORE_BUMPS={di_ngu:'sleep',an_toi:'dinner',vuot_thi:'exam',diem10:'ten'};

const choreDay=(d=new Date())=>dayStr(d);
/* kỳ của việc tuần = ngày thứ Hai của tuần đó */
function choreWeek(d=new Date()){const m=new Date(d.getFullYear(),d.getMonth(),d.getDate());m.setDate(m.getDate()-(m.getDay()+6)%7);return dayStr(m)}
const isSchoolDay=(d=new Date())=>d.getDay()>=1&&d.getDay()<=5;
const choresFor=(d=new Date())=>CHORES.filter(c=>!c.school||isSchoolDay(d));
const choreKey=(id,period)=>id+'@'+period;
const choreLog=()=>S.chore.log;
function choreStatus(id,period){const e=choreLog()[choreKey(id,period)];return !e||e.st==='redo'?'todo':e.st}
/* việc tuần có kỳ là thứ Hai, việc ngày có kỳ là ngày; "past" = kỳ khác kỳ hiện tại */
const choreIsWeek=id=>CHORES_WEEK.some(c=>c.id===id);
const chorePast=(id,period,now=new Date())=>period!==(choreIsWeek(id)?choreWeek(now):choreDay(now));
function choreReport(id,period){
  if(choreStatus(id,period)!=='todo')return false;
  choreLog()[choreKey(id,period)]={st:'wait',t:Date.now()};save();return true;
}
function choreReportExtra(task,now=Date.now()){
  const last=S.chore.extra.filter(x=>x.task===task).reduce((m,x)=>Math.max(m,x.t),-Infinity);
  if(now-last<EXTRA_DEBOUNCE_MS)return null;
  const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  S.chore.extra.push({id,task,st:'wait',t:now});save();return id;
}
function choreCount(k){return Object.values(S.chore.cnt).reduce((n,c)=>n+((c&&c[k])||0),0)}
function choreBump(k,by=1){const d=deviceId(),c=S.chore.cnt[d]=S.chore.cnt[d]||{};c[k]=(c[k]||0)+by}
/* ref là khoá log (id@kỳ) hoặc uid việc đột xuất */
const choreExtraOf=ref=>S.chore.extra.find(x=>x.id===ref);
function choreRate(ref,n){
  if(!Number.isInteger(n)||n<1||n>5)return null;
  const x=choreExtraOf(ref),e=x||choreLog()[ref];
  if(!e||e.st!=='wait')return null;
  const [id,period]=x?[x.task]:ref.split('@');
  S.stars+=n;e.st='done';e.n=n;e.t=Date.now();
  choreBump('done');if(n===5)choreBump('five');
  if(CHORE_BUMPS[id])choreBump(CHORE_BUMPS[id]);
  const box=!x&&choreIsWeek(id)&&n===5;if(box)choreBump('boxIn');
  /* chấm xong việc cuối cùng của buổi sáng thì tính một buổi sáng trọn vẹn */
  if(!x&&CHORES.some(c=>c.id===id&&c.grp==='sang')){
    const [y,m,d]=period.split('-').map(Number);
    if(choresFor(new Date(y,m-1,d)).filter(c=>c.grp==='sang').every(c=>choreStatus(c.id,period)==='done'))choreBump('morning');
  }
  save();return {stars:n,box};
}
/* "Chưa được": việc hôm nay/tuần này cho báo lại, việc kỳ cũ thì đóng */
function choreRedo(ref,now=new Date()){
  const x=choreExtraOf(ref),e=x||choreLog()[ref];
  if(!e||e.st!=='wait')return;
  e.st=x||chorePast(...ref.split('@'),now)?'closed':'redo';e.t=Date.now();save();
}
function chorePending(now=new Date()){
  const out=S.chore.extra.filter(x=>x.st==='wait').map(x=>({ref:x.id,task:x.task,period:null,past:false}));
  for(const k in choreLog())if(choreLog()[k].st==='wait'){const [task,period]=k.split('@');out.push({ref:k,task,period,past:chorePast(task,period,now)})}
  return out;
}
/* Câu khoá: 2–3 số 1–10, có × hoặc ÷; nhân chia trước, chia hết, mọi bước ≥ 0 */
function lockQuestion(rnd=Math.random){
  const pk=a=>a[Math.floor(rnd()*a.length)],OPS=['+','−','×','÷'];
  for(let i=0;i<200;i++){
    const k=pk([2,3]),nums=Array.from({length:k},()=>1+Math.floor(rnd()*10)),ops=Array.from({length:k-1},()=>pk(OPS));
    if(!ops.some(o=>o==='×'||o==='÷'))continue;
    const v=[nums[0]],add=[];let ok=true;
    ops.forEach((o,j)=>{const b=nums[j+1];
      if(o==='×')v[v.length-1]*=b;
      else if(o==='÷'){if(v[v.length-1]%b)ok=false;else v[v.length-1]/=b}
      else{v.push(b);add.push(o)}});
    if(!ok)continue;
    let acc=v[0];
    for(let j=0;j<add.length&&ok;j++){acc+=add[j]==='+'?v[j+1]:-v[j+1];if(acc<0)ok=false}
    if(ok)return {text:nums.map((n,j)=>j?`${ops[j-1]} ${n}`:`${n}`).join(' '),answer:acc};
  }
  return {text:'6 × 7',answer:42};
}
/* Chế độ bố mẹ: chỉ trong bộ nhớ, tự khoá sau 5 phút không bấm */
const PARENT_IDLE_MS=300000;let _parentAt=-Infinity;
const parentOpen=(now=Date.now())=>{_parentAt=now};
const parentOn=(now=Date.now())=>now-_parentAt<PARENT_IDLE_MS;
const parentTouch=(now=Date.now())=>{if(parentOn(now))_parentAt=now};
const parentLock=()=>{_parentAt=-Infinity};
/* Hộp quà chăm ngoan: tỷ lệ cộng dồn; loại hết món thì chọn lại trong các loại còn món; hết sạch thì +5 ⭐ */
let CHORE_BOX_ODDS=[['sticker',35],['talk',25],['song',20],['dress',20]];
const CHORE_BOX_TALK=5,CHORE_BOX_STARS=5;
const choreBoxes=()=>choreCount('boxIn')-choreCount('boxOut');
function choreBoxPrize(rnd=Math.random){
  const pool={sticker:STICKERS.filter(x=>!S.stickers.includes(x)),talk:[CHORE_BOX_TALK],
    song:RADIO_ITEMS.filter(x=>x.price>0&&!hasSong(x.id)).map(x=>x.id),dress:SHOP_ITEMS.filter(x=>!owns(x.id)).map(x=>x.id)};
  const odds=CHORE_BOX_ODDS.filter(([k])=>pool[k]&&pool[k].length);
  if(!odds.length)return {kind:'stars',value:CHORE_BOX_STARS};
  let r=rnd()*odds.reduce((n,o)=>n+o[1],0),kind=odds[odds.length-1][0];
  for(const [k,w] of odds){if(r<w){kind=k;break}r-=w}
  const list=pool[kind];
  return {kind,value:kind==='talk'?CHORE_BOX_TALK:list[Math.floor(rnd()*list.length)]};
}
/* mở một hộp: áp quà vào S (quà không bị trừ sao), null khi hết hộp */
function choreBoxOpen(rnd=Math.random){
  if(choreBoxes()<1)return null;
  const p=choreBoxPrize(rnd);
  if(p.kind==='sticker')S.stickers.push(p.value);
  else if(p.kind==='talk')talkState().gift+=p.value;
  else if(p.kind==='song'){S.songs=[...(S.songs||[]),p.value];S.giftSongs=[...(S.giftSongs||[]),p.value]}
  else if(p.kind==='dress'){S.owned=[...(S.owned||[]),p.value];S.giftOwned=[...(S.giftOwned||[]),p.value]}
  else S.stars+=p.value;
  choreBump('boxOut');save();return p;
}
/* dọn lịch sử: bỏ mục done/closed cũ (ngày/đột xuất > 14 ngày, tuần > 5 tuần), giữ mọi mục wait; cnt không đổi */
function chorePrune(now=new Date()){
  const t0=new Date(now.getFullYear(),now.getMonth(),now.getDate()),cut=(n)=>{const d=new Date(t0);d.setDate(d.getDate()-n);return d.getTime()};
  const dayCut=cut(14),[wy,wm,wd]=choreWeek(now).split('-').map(Number),weekCut=new Date(wy,wm-1,wd-35).getTime();
  const log=choreLog();
  for(const k in log){
    if(log[k].st==='wait')continue;
    const [id,p]=k.split('@'),[y,m,d]=p.split('-').map(Number);
    if(new Date(y,m-1,d).getTime()<(choreIsWeek(id)?weekCut:dayCut))delete log[k];
  }
  S.chore.extra=S.chore.extra.filter(x=>x.st==='wait'||x.t>=dayCut);
  save();
}
/* ===== Huy hiệu chăm ngoan ===== */
/* chuỗi dài nhất các ngày liên tiếp (trong log còn giữ) mà mọi việc của ngày đều done */
function choreGreatRun(){
  const days=new Set();for(const k in choreLog()){const [id,p]=k.split('@');if(!choreIsWeek(id))days.add(p)}
  const ts=[...days].map(p=>{const [y,m,d]=p.split('-').map(Number);return new Date(y,m-1,d)})
    .filter(dt=>choresFor(dt).every(c=>choreStatus(c.id,dayStr(dt))==='done')).map(dt=>dt.getTime()).sort((a,b)=>a-b);
  let best=0,run=0,prev=null;
  for(const t of ts){const n=new Date(t);n.setDate(n.getDate()-1);run=prev!==null&&n.getTime()===prev?run+1:1;prev=t;best=Math.max(best,run)}
  return best;
}
/* có một tuần mà cả 4 việc tuần đều done với 5 sao */
function chorePerfectWeek(){
  const log=choreLog(),weeks=new Set(Object.keys(log).filter(k=>choreIsWeek(k.split('@')[0])).map(k=>k.split('@')[1]));
  return [...weeks].some(w=>CHORES_WEEK.every(c=>{const e=log[choreKey(c.id,w)];return e&&e.st==='done'&&e.n===5}));
}
const CHORE_BADGES=[
  {id:'c_first',icon:'🌷',name:'Công chúa nhỏ',desc:'Được bố mẹ chấm sao lần đầu',ok:()=>choreCount('done')>=1},
  {id:'c_five',icon:'💖',name:'Năm sao đầu tiên',desc:'Một nhiệm vụ được chấm 5 sao',ok:()=>choreCount('five')>=1},
  {id:'c_20',icon:'🎀',name:'Bé chăm làm',desc:'Hoàn thành 20 nhiệm vụ',ok:()=>choreCount('done')>=20},
  {id:'c_100',icon:'👸',name:'Công chúa chăm ngoan',desc:'Hoàn thành 100 nhiệm vụ',ok:()=>choreCount('done')>=100},
  {id:'c_300',icon:'💎',name:'Công chúa kim cương',desc:'Hoàn thành 300 nhiệm vụ',ok:()=>choreCount('done')>=300},
  {id:'c_day',icon:'☀️',name:'Một ngày tuyệt vời',desc:'Mọi nhiệm vụ ngày của một ngày đều được chấm sao',ok:()=>choreGreatRun()>=1},
  {id:'c_day3',icon:'🌈',name:'Ba ngày chăm ngoan',desc:'3 "ngày tuyệt vời" liên tiếp',ok:()=>choreGreatRun()>=3},
  {id:'c_day7',icon:'🏰',name:'Tuần lễ công chúa',desc:'7 "ngày tuyệt vời" liên tiếp',ok:()=>choreGreatRun()>=7},
  {id:'c_box',icon:'🎁',name:'Hộp quà đầu tiên',desc:'Mở hộp quà chăm ngoan đầu tiên',ok:()=>choreCount('boxOut')>=1},
  {id:'c_week',icon:'👑',name:'Tuần hoàn hảo',desc:'Cả 4 nhiệm vụ tuần đều được 5 sao trong cùng một tuần',ok:()=>chorePerfectWeek()},
  {id:'c_morning',icon:'🌅',name:'Chim sơn ca',desc:'Hoàn thành hết nhiệm vụ buổi sáng 7 lần',ok:()=>choreCount('morning')>=7},
  {id:'c_sleep',icon:'🌙',name:'Ngủ ngoan',desc:'"Đi ngủ trước 10 giờ 15" được chấm 10 lần',ok:()=>choreCount('sleep')>=10},
  {id:'c_dinner',icon:'🍚',name:'Bé ăn giỏi',desc:'"Ăn hết cơm tối, ăn đủ rau thịt trong 30 phút" được chấm 10 lần',ok:()=>choreCount('dinner')>=10},
  {id:'c_ten1',icon:'💯',name:'Điểm 10 đầu tiên',desc:'Đạt điểm 10 lần đầu',ok:()=>choreCount('ten')>=1},
  {id:'c_ten10',icon:'📝',name:'Mưa điểm 10',desc:'Đạt điểm 10 tổng cộng 10 lần',ok:()=>choreCount('ten')>=10},
  {id:'c_exam',icon:'🎓',name:'Vượt vũ môn',desc:'Vượt qua 1 kỳ thi',ok:()=>choreCount('exam')>=1}
];
BADGES.push(...CHORE_BADGES);
