/* ============ Quy luật: dãy số, dãy hình ============ */
const PSH=['circle','square','triangle','star','diamond','hexagon'];
const PEM=['🍎','🐟','⭐','🌸','🍓','🐥'];
/* phần tử hình: {k:hình, c:màu, s:kích thước px, r:độ xoay} */
const pSize=it=>it.s||46;
const pKey=it=>[it.k,it.c,pSize(it),it.r||0].join('|');
const pShape=it=>`<span class="pi" style="width:${pSize(it)}px;height:${pSize(it)}px">${svg(it.k,it.c,it.r||0)}</span>`;
const pNum=n=>`<span class="pn">${n}</span>`;
const pDots=(n,em)=>`<span class="pc">${Array(n).fill(em).join('')}</span>`;
const pSeq=(items,rend)=>`<div class="pseq">${items.map(rend).join('')}<span class="pq">?</span></div>`;

/* Ghép câu hỏi: đáp án + các lựa chọn nhiễu (loại trùng, tối đa 4 nút) */
function pQuestion({prompt,items,ans,others,rend,keyf,explain,tag}){
  const seen=new Set([keyf(ans)]),list=[ans];
  others.forEach(o=>{if(list.length<4&&!seen.has(keyf(o))){seen.add(keyf(o));list.push(o)}});
  return{prompt,say:prompt,visual:pSeq(items,rend),
    choices:shuffle(list).map(it=>({html:rend(it),key:keyf(it)})),
    correct:keyf(ans),explain,key:tag+items.map(keyf).join(',')};
}
function pNumQuestion(terms,ans,explain,tag){
  const near=numChoices(ans,0,999,4).map(c=>c.key);
  return pQuestion({prompt:'Số nào đi tiếp?',items:terms,ans,others:near,rend:pNum,keyf:x=>x,explain,tag});
}

/* Mức 1: dãy số tăng +1, +2 */
function patLinear(up){
  const d=pick(up),s=R(1,10),terms=[0,1,2,3].map(i=>s+d*i);
  return pNumQuestion(terms,s+d*4,`Mỗi số tăng thêm ${d}`,'n'+d);
}
/* Mức 2: bước nhảy 2, 3, 5, 10; có thể giảm dần */
function patStep(){
  const d=pick([2,3,5,10]),down=Math.random()<.4,s=down?R(4,9)*d+d:R(0,8);
  const terms=[0,1,2,3].map(i=>down?s-d*i:s+d*i),ans=down?s-d*4:s+d*4;
  return pNumQuestion(terms,ans,down?`Mỗi số giảm đi ${d}`:`Mỗi số tăng thêm ${d}`,'m'+(down?'-':'+')+d);
}
/* Mức 3: hình lặp AB / ABC cùng màu */
function patShapes(){
  const n=pick([2,3]),shapes=shuffle(PSH),c=pick(COLORS),unit=shapes.slice(0,n).map(k=>({k,c}));
  const items=Array.from({length:5},(_,i)=>unit[i%n]),ans=unit[5%n];
  return pQuestion({prompt:'Hình nào đi tiếp?',items,ans,others:shapes.map(k=>({k,c})),rend:pShape,keyf:pKey,
    explain:`Các hình lặp lại: ${unit.map(u=>SHAPES[u.k].vi).join(', ')}`,tag:'h'});
}
/* Mức 4: hình thay đổi cả dạng lẫn màu theo nhịp AAB, ABB, ABC, ABAC */
const PAT_FORMS=['AAB','ABB','ABC','ABAC'];
function patShapeColor(){
  const form=pick(PAT_FORMS),sh=shuffle(PSH),co=shuffle(COLORS);
  const U={A:{k:sh[0],c:co[0]},B:{k:sh[1],c:co[1]},C:{k:sh[2],c:co[2]}};
  const at=i=>U[form[i%form.length]],len=form.length+2;
  const items=Array.from({length:len},(_,i)=>at(i)),ans=at(len);
  const others=[{k:ans.k,c:co[3]},{k:sh[3],c:ans.c},...Object.values(U)];
  return pQuestion({prompt:'Hình nào đi tiếp?',items,ans,others,rend:pShape,keyf:pKey,
    explain:'Nhìn kỹ cả hình dạng và màu sắc nhé',tag:'c'+form});
}
/* Mức 5: dãy số khó */
function patHardNum(){
  const t=pick(['grow','double','weave']);
  if(t==='grow'){
    const s=R(1,5),terms=[s];for(let i=0;i<3;i++)terms.push(terms[i]+i+1);
    return pNumQuestion(terms,terms[3]+4,'Cộng thêm 1, rồi 2, rồi 3, rồi 4...','g');
  }
  if(t==='double'){
    const s=pick([1,2,3,5]),terms=[0,1,2,3].map(i=>s*2**i);
    return pNumQuestion(terms,s*16,'Mỗi số gấp đôi số trước','d');
  }
  const s=R(1,6),f=pick([5,10]),grow=Math.random()<.5;
  const terms=[s,grow?f:f,s+1,grow?2*f:f,s+2];
  return pNumQuestion(terms,grow?3*f:f,grow?`Hai dãy đan xen: ${f}, ${2*f}, ${3*f}...`:'Hai dãy đan xen nhau','w'+(grow?1:0));
}
/* Mức 6: hình biến đổi — to dần, xoay, thêm nhiều */
function patTransform(){
  const t=pick(['size','turn','count']),c=pick(COLORS),k=pick(PSH);
  if(t==='size'){
    const mk=s=>({k,c,s}),items=[22,30,38,46].map(mk),ans=mk(54);
    return pQuestion({prompt:'Hình nào đi tiếp?',items,ans,others:[mk(46),mk(62),mk(38)],rend:pShape,keyf:pKey,
      explain:'Mỗi hình to hơn hình trước',tag:'z'});
  }
  if(t==='turn'){
    const mk=r=>({k:'triangle',c,s:46,r}),items=[0,90,180,270,0].map(mk),ans=mk(90);
    return pQuestion({prompt:'Hình nào đi tiếp?',items,ans,others:[mk(0),mk(180),mk(270)],rend:pShape,keyf:pKey,
      explain:'Mỗi hình xoay thêm một góc vuông',tag:'r'});
  }
  const em=pick(PEM),d=pick([1,2]),s=R(1,3),terms=[0,1,2,3].map(i=>s+d*i),ans=s+d*4;
  const r=n=>pDots(n,em);
  return pQuestion({prompt:'Nhóm nào đi tiếp?',items:terms,ans,others:[ans-1,ans+1,ans-d,ans+d],
    rend:r,keyf:x=>x,explain:`Mỗi nhóm thêm ${d} ${em}`,tag:'k'+d+em});
}
function genPattern(l){
  return [()=>patLinear([1,2]),patStep,patShapes,patShapeColor,patHardNum,patTransform][l]();
}
GAMES.pattern={name:'Quy luật',icon:'🧩',color:'#7e57c2',levels:['Dãy số tăng đều','Dãy số cách quãng','Dãy hình lặp','Hình và màu sắc','Dãy số khó','Hình biến đổi'],gen:genPattern,desc:'Tìm quy luật dãy số, dãy hình'};
