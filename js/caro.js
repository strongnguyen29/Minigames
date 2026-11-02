/* ============ Cờ ca rô (2 người, bàn cờ vô hạn) ============ */
const CARO_WIN=5,CARO_DIRS=[[1,0],[0,1],[1,1],[1,-1]],CARO_COL={X:'#ef5350',O:'#42a5f5'};
let C=null;
const ckey=(x,y)=>x+','+y;
/* các ô thẳng hàng >= 5 quân cùng loại đi qua (x,y), hoặc null */
function caroLine(cells,x,y,p){
  for(const [dx,dy] of CARO_DIRS){
    const line=[[x,y]];
    for(const sg of [1,-1]){
      let i=x+dx*sg,j=y+dy*sg;
      while(cells.get(ckey(i,j))===p){line.push([i,j]);i+=dx*sg;j+=dy*sg}
    }
    if(line.length>=CARO_WIN)return line;
  }
  return null;
}
function caro(){
  C={cells:new Map(),moves:[],turn:'X',win:null,cam:{x:.5,y:.5,s:38}};
  app.innerHTML=topbar('caroLeave()')+`<h2>❌⭕ Cờ ca rô</h2><div class="caro-st" id="cs"></div>
  <canvas id="caro"></canvas>
  <p class="sub" style="font-size:15px;margin:8px 0 0">Kéo để di chuyển · lăn chuột / chụm hai ngón để phóng to · ${CARO_WIN} quân liên tiếp là thắng</p>
  <div class="row" style="margin-top:10px"><button class="btn gray" id="cu" style="font-size:18px">↩️ Đi lại</button>
  <button class="btn alt" id="cc" style="font-size:18px">🎯 Về giữa</button>
  <button class="btn" id="cn" style="font-size:18px">🔄 Ván mới</button></div>`;
  const cv=$('#caro');
  $('#cu').onclick=caroUndo;
  $('#cn').onclick=()=>{sfx.click();caro()};
  $('#cc').onclick=()=>{sfx.click();const m=C.moves[C.moves.length-1];C.cam.x=m?m[0]+.5:.5;C.cam.y=m?m[1]+.5:.5;caroDraw()};
  caroBind(cv);
  window.onresize=()=>{if($('#caro'))caroDraw();else window.onresize=null};
  caroDraw();
}
function caroLeave(){window.onresize=null;C=null;home()}
function caroStatus(){
  const t=C.turn;
  $('#cs').innerHTML=C.win?`🎉 <b class="${C.win.p}">${C.win.p==='X'?'❌':'⭕'}</b> thắng rồi!`:`Lượt của <b class="${t}">${t==='X'?'❌':'⭕'}</b>`;
  $('#cu').disabled=!C.moves.length;
}
function caroUndo(){
  if(!C.moves.length)return;
  sfx.click();
  const [x,y]=C.moves.pop();
  C.turn=C.cells.get(ckey(x,y));C.cells.delete(ckey(x,y));C.win=null;
  caroDraw();
}
function caroZoom(f,px,py,w,h){
  const c=C.cam,wx=c.x+(px-w/2)/c.s,wy=c.y+(py-h/2)/c.s;
  c.s=Math.min(90,Math.max(12,c.s*f));
  c.x=wx-(px-w/2)/c.s;c.y=wy-(py-h/2)/c.s;
}
function caroPlace(px,py,w,h){
  if(C.win)return;
  const c=C.cam,x=Math.floor(c.x+(px-w/2)/c.s),y=Math.floor(c.y+(py-h/2)/c.s),k=ckey(x,y);
  if(C.cells.has(k))return;
  const p=C.turn;
  C.cells.set(k,p);C.moves.push([x,y]);
  const line=caroLine(C.cells,x,y,p);
  if(line){C.win={p,line};sfx.win();confetti(40)}
  else{C.turn=p==='X'?'O':'X';tone(p==='X'?520:660,0,.12,'triangle',.12)}
  caroDraw();
}
function caroBind(cv){
  const ps=new Map();let moved=0;
  const size=()=>[cv.clientWidth,cv.clientHeight];
  const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  const dist=()=>{const [a,b]=[...ps.values()];return Math.hypot(a[0]-b[0],a[1]-b[1])};
  cv.onpointerdown=e=>{try{cv.setPointerCapture(e.pointerId)}catch(_){}ps.set(e.pointerId,pos(e));if(ps.size===1)moved=0;else moved=99};
  cv.onpointermove=e=>{
    if(!ps.has(e.pointerId))return;
    const [w,h]=size(),old=ps.get(e.pointerId),cur=pos(e);
    if(ps.size===1){
      const dx=cur[0]-old[0],dy=cur[1]-old[1];moved+=Math.abs(dx)+Math.abs(dy);
      if(moved>=8){C.cam.x-=dx/C.cam.s;C.cam.y-=dy/C.cam.s;ps.set(e.pointerId,cur);caroDraw()}
    }else if(ps.size===2){
      const d0=dist();ps.set(e.pointerId,cur);
      const [a,b]=[...ps.values()];
      caroZoom(dist()/d0,(a[0]+b[0])/2,(a[1]+b[1])/2,w,h);caroDraw();
    }
  };
  cv.onpointerup=e=>{
    if(!ps.has(e.pointerId))return;
    const was1=ps.size===1,[w,h]=size(),[px,py]=pos(e);
    ps.delete(e.pointerId);
    if(was1&&moved<8)caroPlace(px,py,w,h);
  };
  cv.onpointercancel=e=>ps.delete(e.pointerId);
  cv.addEventListener('wheel',e=>{e.preventDefault();const [w,h]=size(),[px,py]=pos(e);caroZoom(e.deltaY<0?1.15:1/1.15,px,py,w,h);caroDraw()},{passive:false});
}
function caroDraw(){
  const cv=$('#caro');if(!cv||!C)return;
  const w=cv.clientWidth,h=Math.max(320,Math.round(innerHeight-330)),dpr=window.devicePixelRatio||1;
  cv.style.height=h+'px';cv.width=w*dpr;cv.height=h*dpr;
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  const {x:cx,y:cy,s}=C.cam,sx=i=>w/2+(i-cx)*s,sy=j=>h/2+(j-cy)*s;
  const i0=Math.floor(cx-w/2/s),i1=Math.ceil(cx+w/2/s),j0=Math.floor(cy-h/2/s),j1=Math.ceil(cy+h/2/s);
  g.fillStyle='#fffdf5';g.fillRect(0,0,w,h);
  const last=C.moves[C.moves.length-1];
  if(C.win){g.fillStyle='#b9f6ca';C.win.line.forEach(([i,j])=>g.fillRect(sx(i),sy(j),s,s))}
  else if(last){g.fillStyle='#fff3b0';g.fillRect(sx(last[0]),sy(last[1]),s,s)}
  g.strokeStyle='#d6e4ee';g.lineWidth=1;g.beginPath();
  for(let i=i0;i<=i1;i++){const x=Math.round(sx(i))+.5;g.moveTo(x,0);g.lineTo(x,h)}
  for(let j=j0;j<=j1;j++){const y=Math.round(sy(j))+.5;g.moveTo(0,y);g.lineTo(w,y)}
  g.stroke();
  g.lineWidth=Math.max(2,s/8);g.lineCap='round';
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const p=C.cells.get(ckey(i,j));if(!p)continue;
    const x=sx(i),y=sy(j),m=s*.25;
    g.strokeStyle=CARO_COL[p];g.beginPath();
    if(p==='X'){g.moveTo(x+m,y+m);g.lineTo(x+s-m,y+s-m);g.moveTo(x+s-m,y+m);g.lineTo(x+m,y+s-m)}
    else g.arc(x+s/2,y+s/2,s/2-m,0,Math.PI*2);
    g.stroke();
  }
  caroStatus();
}
