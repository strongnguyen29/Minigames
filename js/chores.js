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
