/* ============ Hình học (SVG) ============ */
const SHAPES={
  circle:{vi:'tròn',svg:'<circle cx="50" cy="50" r="44"/>'},
  square:{vi:'vuông',svg:'<rect x="10" y="10" width="80" height="80" rx="4"/>'},
  triangle:{vi:'tam giác',svg:'<polygon points="50,8 94,90 6,90"/>'},
  rectangle:{vi:'chữ nhật',svg:'<rect x="4" y="25" width="92" height="50" rx="4"/>'},
  oval:{vi:'bầu dục',svg:'<ellipse cx="50" cy="50" rx="46" ry="30"/>'},
  diamond:{vi:'thoi',svg:'<polygon points="50,4 96,50 50,96 4,50"/>'},
  star:{vi:'ngôi sao',svg:'<polygon points="50,5 61,38 96,38 68,58 79,92 50,71 21,92 32,58 4,38 39,38"/>'},
  pentagon:{vi:'ngũ giác',svg:'<polygon points="50,6 93.7,37.8 77,89.2 23,89.2 6.3,37.8"/>'},
  hexagon:{vi:'lục giác',svg:'<polygon points="96,50 73,89.8 27,89.8 4,50 27,10.2 73,10.2"/>'},
  trapezoid:{vi:'thang',svg:'<polygon points="28,22 72,22 96,78 4,78"/>'}
};
const SIDES={circle:0,triangle:3,square:4,rectangle:4,diamond:4,trapezoid:4,pentagon:5,hexagon:6};
const COLORS=['#ef5350','#42a5f5','#66bb6a','#ffa726','#ab47bc','#26c6da'];
const shapeName=k=>k==='star'?'ngôi sao':'hình '+SHAPES[k].vi;
function svg(k,color,rot=0){return `<svg viewBox="0 0 100 100" fill="${color}" style="transform:rotate(${rot}deg)">${SHAPES[k].svg}</svg>`}
const dots=(n,em)=>`<div class="grp">${Array(n).fill(em).join('')}</div>`;
const OBJ=['🍎','🐟','⭐','🌸','🐞','🎈','🍓','🐥'];

/* ============ Sinh câu hỏi ============ */
/* câu hỏi: {prompt, visual, choices:[{html,key}], correct, key} */
function numChoices(c,min=0,max=99,n=4){
  const s=new Set([c]);let guard=0;
  while(s.size<n&&guard++<80){
    const v=c+R(-3,3);if(v>=min&&v<=max)s.add(v);
  }
  return shuffle([...s]).map(v=>({html:String(v),key:v}));
}
/* ---- Đếm hình: 3 mức ---- */
const STK='#2b3a55',FT='#ffab91',FS='#90caf9',FC='#a5d6a7',FY='#ffe082';
const poly=(p,f)=>`<polygon points="${p}" fill="${f}" stroke="${STK}" stroke-width="3" stroke-linejoin="round"/>`;
const ln=(a,b,c,d)=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${STK}" stroke-width="3" stroke-linecap="round"/>`;
const cir=(x,y,r,f)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${STK}" stroke-width="3"/>`;
const fig=s=>`<div class="fig"><svg viewBox="0 0 200 200" style="width:min(250px,70vw);height:min(250px,70vw)">${s}</svg></div>`;
const SQ='30,30 170,30 170,170 30,170';

/* Hình lồng nhau (các hình chung tâm, hình sau nằm gọn trong hình trước) */
const INR={circle:1,square:.7071,triangle:.5};
function nestedPlan(types){
  let R=92;const rs=[];
  types.forEach((t,i)=>{rs.push(R);R=(types[i+1]===t?.7:INR[t]*.85)*R});
  return rs;
}
function nestedScene(types){
  const rs=nestedPlan(types),cnt={};let s='';
  types.forEach((t,i)=>{
    const R=rs[i],c=COLORS[i%COLORS.length];cnt[t]=(cnt[t]||0)+1;
    const a=`fill="${c}" stroke="#fff" stroke-width="3" stroke-linejoin="round"`;
    if(t==='circle')s+=`<circle cx="100" cy="100" r="${R}" ${a}/>`;
    else if(t==='square'){const h=R*.7071;s+=`<rect x="${100-h}" y="${100-h}" width="${2*h}" height="${2*h}" ${a}/>`}
    else s+=`<polygon points="100,${100-R} ${100+R*.866},${100+R*.5} ${100-R*.866},${100+R*.5}" ${a}/>`;
  });
  return{svg:s,counts:cnt};
}
function nestedTypesMulti(lo=4,hi=5){
  const T=['circle','square','triangle'];
  for(let k=0;k<400;k++){
    const n=R(lo,hi),ty=Array.from({length:n},()=>pick(T));
    if(new Set(ty).size<2)continue;
    if(nestedPlan(ty).pop()*(INR[ty[n-1]])>=11)return ty;
  }
  return['circle','square','circle','triangle'];
}

/* Hình ghép 1 loại (mức 2) */
function comp2(){
  const m=R(0,6);
  if(m===0)return{id:'t1',svg:poly('100,20 20,175 180,175',FY)+ln(100,20,100,175),counts:{triangle:3},ex:'2 hình nhỏ + 1 hình lớn = 3 hình tam giác'};
  if(m===1)return{id:'t2',svg:poly('100,20 20,175 180,175',FY)+ln(100,20,73.3,175)+ln(100,20,126.7,175),counts:{triangle:6},ex:'3 hình nhỏ + 2 hình ghép đôi + 1 hình lớn = 6 hình tam giác'};
  if(m===2){
    const k=R(1,2),ys=k===1?[100]:[75,125];
    const s=poly('100,20 20,175 180,175',FY)+ys.map(y=>{const h=80*(y-20)/155;return ln(100-h,y,100+h,y)}).join('');
    return{id:'tc'+k,svg:s,counts:{triangle:k+1},ex:k===1?'1 hình nhỏ ở trên + 1 hình lớn = 2 hình tam giác':'1 hình nhỏ + 1 hình vừa + 1 hình lớn = 3 hình tam giác'};
  }
  if(m===3)return{id:'t4',svg:poly('100,20 20,175 180,175',FY)+ln(60,97.5,140,97.5)+ln(140,97.5,100,175)+ln(60,97.5,100,175),counts:{triangle:5},ex:'4 hình nhỏ + 1 hình lớn = 5 hình tam giác'};
  if(m===4){
    const both=Math.random()<.5;
    return both?{id:'sd2',svg:poly(SQ,FY)+ln(30,30,170,170)+ln(170,30,30,170),counts:{triangle:8},ex:'4 hình nhỏ + 4 hình ghép đôi = 8 hình tam giác'}
      :{id:'sd1',svg:poly(SQ,FY)+ln(30,30,170,170),counts:{triangle:2},ex:'Đường chéo chia hình vuông thành 2 hình tam giác'};
  }
  if(m===5)return{id:'g2',svg:poly(SQ,FY)+ln(100,30,100,170)+ln(30,100,170,100),counts:{square:5},ex:'4 hình vuông nhỏ + 1 hình vuông lớn = 5 hình vuông'};
  const t=pick(['circle','square','triangle']),k=R(2,4),sc=nestedScene(Array(k).fill(t));
  return{id:'n'+t+k,svg:sc.svg,counts:sc.counts,ex:`Có ${k} ${shapeName(t)} nằm trong nhau`};
}
/* Hình ghép nhiều loại (mức 3) */
function comp3(){
  const m=R(0,5);
  const mid=poly(SQ,FS)+poly('30,30 100,30 30,100',FT)+poly('170,30 170,100 100,30',FT)+poly('170,170 100,170 170,100',FT)+poly('30,170 30,100 100,170',FT)+poly('100,30 170,100 100,170 30,100',FY);
  if(m===0)return{id:'m0',svg:mid,counts:{triangle:4,square:2}};
  if(m===1)return{id:'m1',svg:mid+cir(100,100,44,FC),counts:{triangle:4,square:2,circle:1}};
  if(m===2)return{id:'m2',svg:poly('100,20 20,175 180,175',FY)+ln(60,97.5,140,97.5)+ln(140,97.5,100,175)+ln(60,97.5,100,175)+cir(100,123,19,FC),counts:{triangle:5,circle:1}};
  if(m===3)return{id:'m3',svg:poly(SQ,FY)+ln(100,30,100,170)+ln(30,100,170,100)+cir(65,65,25,FC)+cir(135,65,25,FC)+cir(65,135,25,FC)+cir(135,135,25,FC),counts:{square:5,circle:4}};
  if(m===4)return{id:'m4',svg:poly('50,90 150,90 150,190 50,190',FS)+poly('40,90 160,90 100,28',FT)+poly('62,110 92,110 92,140 62,140',FY)+poly('108,110 138,110 138,140 108,140',FY)+cir(100,64,12,FC),counts:{square:3,triangle:1,circle:1}};
  const ty=nestedTypesMulti(),sc=nestedScene(ty);
  return{id:'nm'+ty.join(''),svg:sc.svg,counts:sc.counts};
}
/* Lưới ô vuông n×n trong khung SQ (30..170) */
function gridLines(n){
  let s='';
  for(let i=1;i<n;i++){const p=30+140*i/n;s+=ln(p,30,p,170)+ln(30,p,170,p)}
  return s;
}
/* Hàng n ô vuông cạnh 36, tuỳ chọn có hình tròn trong mỗi ô */
function squareRow(n,withCircles){
  const s=36,x0=(200-n*s)/2;let out='';
  for(let i=0;i<n;i++){
    const x=x0+i*s;
    out+=poly(`${x},82 ${x+s},82 ${x+s},${82+s} ${x},${82+s}`,FY);
    if(withCircles)out+=cir(x+s/2,82+s/2,12,FC);
  }
  return out;
}
/* Hình ghép nâng cao (mức 4) */
function comp4(){
  const m=R(0,2);
  if(m===0){
    const k=R(3,4),ys=Array.from({length:k},(_,j)=>20+155*(j+1)/(k+1));
    const s=poly('100,20 20,175 180,175',FY)+ys.map(y=>{const h=80*(y-20)/155;return ln(100-h,y,100+h,y)}).join('');
    return{id:'tc'+k,svg:s,counts:{triangle:k+1},ex:`${k} đường ngang chia tam giác thành ${k+1} hình tam giác chồng lên nhau, tính từ đỉnh`};
  }
  if(m===1)return{id:'g3',svg:poly(SQ,FY)+gridLines(3),counts:{square:14},ex:'9 hình nhỏ + 4 hình vuông 2×2 + 1 hình lớn = 14 hình vuông'};
  const n=R(3,5);
  return{id:'row'+n,svg:squareRow(n,false),counts:{square:n},ex:`${n} hình vuông nhỏ xếp thành một hàng`};
}
/* Hình ghép thử thách (mức 5) */
function comp5(){
  const m=R(0,3);
  if(m===0)return{id:'g3c',svg:poly(SQ,FY)+gridLines(3)+[0,1,2].map(i=>[0,1,2].map(j=>cir(30+140*(i+.5)/3,30+140*(j+.5)/3,17,FC)).join('')).join(''),counts:{square:14,circle:9}};
  if(m===1)return{id:'t5c',svg:poly('100,20 20,175 180,175',FY)+ln(60,97.5,140,97.5)+ln(140,97.5,100,175)+ln(60,97.5,100,175)+cir(100,73,16,FC)+cir(60,150.6,16,FC)+cir(140,150.6,16,FC),counts:{triangle:5,circle:3}};
  if(m===2){const n=R(3,5);return{id:'rowc'+n,svg:squareRow(n,true),counts:{square:n,circle:n}}}
  const ty=nestedTypesMulti(5,6),sc=nestedScene(ty);
  return{id:'nx'+ty.join(''),svg:sc.svg,counts:sc.counts};
}
function genCount(l){
  if(l===0){
    if(Math.random()<.25){
      const n=R(1,6),em=pick(OBJ);
      return{prompt:'Có bao nhiêu '+em+' ?',visual:dots(n,em).replace('class="grp"','class="grp" style="max-width:none;font-size:46px"'),choices:numChoices(n,1,8,3),correct:n,key:'c0'+n+em};
    }
    const kinds=shuffle(['circle','square','triangle','rectangle','star']);
    const target=kinds[0],other=kinds[1],n=R(1,8),items=[];
    for(let i=0;i<n;i++)items.push([target,COLORS[i%COLORS.length]]);
    const m=R(1,3);for(let i=0;i<m;i++)items.push([other,pick(COLORS)]);
    if(Math.random()<.5){const o2=kinds[2];for(let i=0;i<R(1,2);i++)items.push([o2,pick(COLORS)])}
    return{prompt:'Có bao nhiêu '+shapeName(target)+'?',visual:shuffle(items).map(([k,c])=>svg(k,c,R(-15,15))).join(''),
      choices:numChoices(n,1,10,4),correct:n,key:'c1'+target+n+items.length};
  }
  if(l===3){
    const kinds=shuffle(['circle','square','triangle','rectangle','star']);
    const target=kinds[0],n=R(6,12),items=[];
    for(let i=0;i<n;i++)items.push([target,COLORS[i%COLORS.length]]);
    for(let j=1;j<=3;j++){for(let i=0,c=R(1,3);i<c;i++)items.push([kinds[j],pick(COLORS)])}
    return{prompt:'Có bao nhiêu '+shapeName(target)+'?',visual:shuffle(items).map(([k,c])=>svg(k,c,R(-15,15))).join(''),
      choices:numChoices(n,1,16,4),correct:n,key:'c3'+target+n+items.length};
  }
  let sc,kind;
  const COMP=[null,comp2,comp3,null,comp4,comp5];
  for(let t=0;t<30;t++){
    sc=COMP[l]();
    const ks=Object.keys(sc.counts);
    // từ mức 3: ưu tiên hỏi loại có số lượng >= 2
    const good=l>=2?ks.filter(k=>sc.counts[k]>=2):ks;
    kind=pick(good.length?good:ks);
    if(sc.counts[kind]<=14)break;
  }
  const n=sc.counts[kind];
  const ex=sc.ex||('Trong hình có: '+Object.entries(sc.counts).map(([k,v])=>`${v} ${shapeName(k)}`).join(', '));
  return{prompt:'Có bao nhiêu '+shapeName(kind)+' trong hình này?',visual:fig(sc.svg),choices:numChoices(n,1,16,4),correct:n,key:'f'+sc.id+kind,explain:ex,say:'Có bao nhiêu '+shapeName(kind)+' trong hình này?'};
}

/* Mức 4-6 của Nhận biết hình: cạnh và đỉnh */
function genSides(l){
  const poly_=['triangle','square','rectangle','diamond','trapezoid','pentagon','hexagon'];
  if(l===3||l===4){
    const target=pick(l===3?poly_:[...poly_,'circle']),w=l===4&&Math.random()<.5?'đỉnh':'cạnh',n=SIDES[target];
    const nums=l===3?[3,4,5,6]:shuffle([0,3,4,5,6].filter(v=>v!==n)).slice(0,3).concat(n);
    return{prompt:`Hình này có mấy ${w}?`,visual:`<div class="shapebig">${svg(target,pick(COLORS))}</div>`,
      choices:shuffle(nums).map(v=>({html:String(v),key:v})),correct:n,key:'q'+l+target+w+Math.random(),say:`Hình này có mấy ${w}?`};
  }
  const n=pick([0,3,4,5,6]),counts=shuffle([0,3,4,5,6].filter(v=>v!==n)).slice(0,3).concat(n);
  const byCount=v=>pick(Object.keys(SIDES).filter(k=>SIDES[k]===v));
  const text=n===0?'Chọn hình không có cạnh':`Chọn hình có ${n} cạnh`;
  return{prompt:text,visual:'<div class="big">🔍</div>',
    choices:shuffle(counts).map(v=>({html:svg(byCount(v),pick(COLORS)),key:v})),correct:n,key:'q5'+n+Math.random(),say:text};
}
function genShape(l){
  if(l>=3)return genSides(l);
  const pool=l===0?['circle','square','triangle']:l===1?['circle','square','triangle','rectangle']:['circle','square','triangle','rectangle','oval','diamond','star'];
  const target=pick(pool);
  if(Math.random()<.5){
    const names=shuffle(pool).slice(0,Math.min(pool.length,4));if(!names.includes(target))names[0]=target;
    return{prompt:'Đây là hình gì?',visual:`<div class="shapebig">${svg(target,pick(COLORS))}</div>`,
      choices:shuffle(names).map(k=>({html:`<span style="font-size:26px">${k==='star'?'Ngôi sao':'Hình '+SHAPES[k].vi}</span>`,key:k})),correct:target,key:'s1'+target+Math.random()};
  }
  const ks=shuffle(pool).slice(0,Math.min(pool.length,l===0?3:4));if(!ks.includes(target))ks[0]=target;
  return{prompt:'Chọn '+shapeName(target)+'',visual:'<div class="big">🔍</div>',
    choices:shuffle(ks).map(k=>({html:svg(k,pick(COLORS)),key:k})),correct:target,key:'s2'+target+Math.random()};
}
const RANGES=[5,10,20,30,50,100];
function genAdd(l){
  const m=RANGES[l];let a,b;
  do{
    a=R(1,m-1);b=R(1,m-1);
  }while(a+b>m||(l>=2&&a+b<=RANGES[l-1]));
  if(l>=2&&Math.random()<.2){a=R(1,RANGES[l-1]);b=R(1,RANGES[l-1])}
  const s=a+b,em=pick(OBJ);
  const vis=m<=10?`<div class="eq">${dots(a,em)}<span class="op">+</span>${dots(b,em).replace('grp','grp b')}</div>`
    :`<div class="eq"><span class="big">${a}</span><span class="op">+</span><span class="big">${b}</span></div>`;
  return{prompt:`Gộp lại: ${a} + ${b} = ?`,visual:vis,choices:numChoices(s,0,m,4),correct:s,key:`a${a}+${b}`,say:`${a} cộng ${b} bằng mấy?`};
}
function genSplit(l){
  const m=RANGES[l];
  const t=[[2,5],[4,10],[11,20],[21,30],[31,50],[51,100]].map(([lo,hi])=>R(lo,hi))[l];
  const a=R(1,t-1),b=t-a,em=pick(OBJ);
  const vis=m<=10?`<div class="eq">${dots(a,em)}<span class="op">+</span><span class="grp b" style="font-size:44px">❓</span></div><div style="font-size:22px;width:100%">Tất cả: ${t}</div>`
    :`<div class="eq"><span class="big">${t}</span><span class="op">=</span><span class="big">${a}</span><span class="op">+</span><span class="big">❓</span></div>`;
  return{prompt:`Số ${t} gồm ${a} và mấy?`,visual:vis,choices:numChoices(b,0,m,4),correct:b,key:`p${t}-${a}`,say:`Số ${t} gồm ${a} và mấy?`};
}
function genCmp(l){
  const m=RANGES[l];let a=R(0,m),b=R(0,m);
  if(l>=3&&Math.random()<.4)b=Math.min(m,Math.max(0,a+R(-5,5)));
  if(Math.random()<.2)b=a;
  const c=a>b?'>':a<b?'<':'=';
  return{prompt:'Điền dấu thích hợp',visual:`<div class="eq"><span class="big">${a}</span><span class="big" style="color:var(--pri)">?</span><span class="big">${b}</span></div>`,
    choices:[{html:'&lt;',key:'<'},{html:'=',key:'='},{html:'&gt;',key:'>'}],correct:c,key:`k${a}_${b}`,say:`So sánh ${a} và ${b}`};
}
const GAMES={
  count:{name:'Đếm hình',icon:'🔢',color:'#ff8a65',levels:['Hình độc lập','Hình trong hình','Hình lồng nhiều loại','Đếm nhiều hình','Hình ghép nâng cao','Hình ghép thử thách'],gen:genCount,desc:'Đếm hình, đếm hình ghép'},
  shape:{name:'Nhận biết hình',icon:'🔺',color:'#ab47bc',levels:['Dễ: 3 hình','Vừa: 4 hình','Khó: 7 hình','Đếm cạnh','Cạnh và đỉnh','Chọn theo số cạnh'],gen:genShape,desc:'Tròn, vuông, tam giác...'},
  add:{name:'Gộp số',icon:'➕',color:'#26a69a',levels:['Phạm vi 5','Phạm vi 10','Phạm vi 20','Phạm vi 30','Phạm vi 50','Phạm vi 100'],gen:genAdd,desc:'Gộp hai nhóm lại'},
  split:{name:'Tách số',icon:'✂️',color:'#42a5f5',levels:['Phạm vi 5','Phạm vi 10','Phạm vi 20','Phạm vi 30','Phạm vi 50','Phạm vi 100'],gen:genSplit,desc:'Số này gồm mấy và mấy?'},
  cmp:{name:'So sánh số',icon:'⚖️',color:'#ec407a',levels:['Phạm vi 5','Phạm vi 10','Phạm vi 20','Phạm vi 30','Phạm vi 50','Phạm vi 100'],gen:genCmp,desc:'Lớn hơn, bé hơn, bằng'}
};

