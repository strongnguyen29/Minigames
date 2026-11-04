/* ============ Đồng bộ tiến độ lên mây (sao lưu; localStorage vẫn là nơi lưu chính) ============ */
const CLOUD_KEY='be_vui_cloud_v1';
const PUSH_DELAY=3000;
const SWITCH_MSG='Máy này đang có tiến độ của tài khoản khác. Dùng dữ liệu của tài khoản mới (tiến độ trên máy sẽ được thay)?';
/* adapter Firebase thật: nạp SDK từ gstatic, Auth Google, Firestore (chỉ khi FIREBASE_CONFIG đã điền) */
function firebaseAdapter(){
  if(typeof FIREBASE_CONFIG==='undefined'||!FIREBASE_CONFIG)return Promise.reject(new Error('chưa cấu hình Firebase'));
  const B='https://www.gstatic.com/firebasejs/10.14.1/';
  return Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]).then(([A,Au,F])=>{
    const app=A.initializeApp(FIREBASE_CONFIG),auth=Au.getAuth(app),db=F.getFirestore(app);
    const ref=uid=>F.doc(db,'users',uid,'profiles','main');
    const standalone=()=>{try{return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
    const provider=()=>new Au.GoogleAuthProvider();
    Au.getRedirectResult(auth).catch(()=>{});
    return {
      onAuth(cb){Au.onAuthStateChanged(auth,u=>cb(u?{uid:u.uid,email:u.email}:null))},
      signIn(){
        return Au.signInWithPopup(auth,provider()).then(()=>{}).catch(e=>{
          const c=e&&e.code;
          const fallback=c==='auth/popup-blocked'||c==='auth/operation-not-supported-in-this-environment'||(c==='auth/popup-closed-by-user'&&standalone());
          if(fallback)return Au.signInWithRedirect(auth,provider());
          throw e;
        });
      },
      signOut(){return Au.signOut(auth)},
      get(uid){return F.getDoc(ref(uid)).then(s=>s.exists()?s.data():null)},
      set(uid,data){return F.setDoc(ref(uid),Object.assign({},data,{updatedAt:F.serverTimestamp()}))}
    };
  });
}
const cloud=(()=>{
  /* synced: lần kéo cho user hiện tại đã xong (đã qua bước hỏi đổi tài khoản); chưa xong thì không được đẩy */
  let adapter=null,loading=null,user=null,synced=false,timer=null,quiet=false,chain=Promise.resolve();
  const priceOf=id=>{const it=SHOP_ITEMS.find(x=>x.id===id);return it?it.price:0};
  const rd=()=>{try{return JSON.parse(localStorage.getItem(CLOUD_KEY))||{}}catch(e){return {}}};
  const wr=p=>{const c=Object.assign(rd(),p);try{localStorage.setItem(CLOUD_KEY,JSON.stringify(c))}catch(e){}return c};
  const fail=e=>{console.warn('[cloud]',(e&&e.message)||e);wr({error:true})};
  /* lên mây: bỏ cài đặt riêng của máy, thêm schema và deviceId */
  const toCloud=s=>{const d=JSON.parse(JSON.stringify(s));LOCAL_ONLY.forEach(k=>delete d[k]);d.schema=1;d.deviceId=deviceId();return d};
  /* từ mây: phần sao không có trong earned thuộc về máy ghi gần nhất; bỏ các trường chỉ có trên mây */
  const fromCloud=r=>{if(!r)return null;const d=JSON.parse(JSON.stringify(r));foldEarned(d,d.deviceId||'cloud');
    ['schema','deviceId','updatedAt'].forEach(k=>delete d[k]);return d};
  /* thay nội dung S tại chỗ, giữ cài đặt âm thanh của máy */
  const replace=next=>{const keep={};LOCAL_ONLY.forEach(k=>{if(k in S)keep[k]=S[k]});
    for(const k in S)delete S[k];Object.assign(S,freshSave(),JSON.parse(JSON.stringify(next)),keep)};
  const merged=remote=>mergeSave(foldEarned(S,deviceId()),remote,priceOf);
  /* ghi local mà không hẹn thêm một lần đẩy */
  const writeLocal=()=>{quiet=true;try{save()}finally{quiet=false}};
  const put=u=>adapter.set(u.uid,toCloud(foldEarned(S,deviceId())));
  /* chạy lần lượt để kéo và đẩy không chen nhau */
  const run=fn=>(chain=chain.then(fn,fn));
  function onAuth(u){
    user=u&&u.uid?{uid:u.uid,email:u.email||''}:null;synced=false;
    if(user)run(pull);
  }
  function ensure(){
    if(!loading)loading=Promise.resolve().then(()=>cloud.loadAdapter()).then(a=>{adapter=a;a.onAuth(onAuth);return a},
      e=>{loading=null;throw e});
    return loading;
  }
  async function pull(){
    const u=user;if(!u||!adapter)return;
    try{
      const remote=fromCloud(await adapter.get(u.uid));
      if(user!==u)return;
      const c=rd(),prev=c.uid||c.lastUid,hadName=!isEmptySave(S);
      if(prev&&prev!==u.uid&&hadName){
        if(!(typeof confirm==='function'&&confirm(SWITCH_MSG))){await cloud.signOut();return}
        if(remote){replace(remote);writeLocal()}else await put(u);
      }else if(!remote){if(hadName)await put(u)}
      else if(!hadName){replace(remote);writeLocal()}
      else{replace(merged(remote));writeLocal();await put(u)}
      wr({uid:u.uid,email:u.email,lastSync:Date.now(),lastUid:undefined,error:undefined});
      synced=true;
      cloud.onChange(hadName);
    }catch(e){fail(e)}
  }
  async function push(){
    const u=user;if(!u||!adapter||!synced)return;
    try{
      const remote=fromCloud(await adapter.get(u.uid));
      if(user!==u)return;
      if(remote){replace(merged(remote));writeLocal()}
      else if(isEmptySave(S))return;
      await put(u);
      wr({lastSync:Date.now(),error:undefined});
    }catch(e){fail(e)}
  }
  /* chưa kéo thành công thì thử kéo lại (để bước hỏi đổi tài khoản chạy), không đẩy */
  const flush=()=>{clearTimeout(timer);timer=null;return run(synced?push:pull)};
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'&&user&&(timer||rd().error))flush();
  });
  return {
    available:!!FIREBASE_CONFIG||!!window.CLOUD_ADAPTER,
    loadAdapter:()=>window.CLOUD_ADAPTER?Promise.resolve(window.CLOUD_ADAPTER):firebaseAdapter(),
    onChange(hadName){},
    state(){const c=rd();return {signedIn:!!user,email:user?user.email:'',lastSync:c.lastSync||0,error:!!c.error}},
    init(){
      if(!cloud.available||!rd().used)return Promise.resolve();
      return ensure().then(()=>{},fail);
    },
    /* nạp sẵn adapter khi nút đăng nhập hiện ra, để signIn mở popup ngay trong lần chạm */
    prepare(){
      if(!cloud.available)return Promise.resolve();
      return ensure().then(()=>{},e=>console.warn('[cloud]',(e&&e.message)||e));
    },
    signIn(){
      const go=a=>{wr({used:true});return a.signIn()};
      if(adapter){
        try{return Promise.resolve(go(adapter)).catch(fail)}catch(e){fail(e);return Promise.resolve()}
      }
      return ensure().then(go).catch(fail);
    },
    signOut(){
      clearTimeout(timer);timer=null;user=null;synced=false;
      const c=rd();
      wr({used:false,uid:undefined,email:undefined,lastSync:undefined,lastUid:c.uid||c.lastUid});
      return Promise.resolve(adapter&&adapter.signOut()).catch(fail);
    },
    pull:()=>run(pull),
    push:()=>run(push),
    pushSoon(){
      if(!user||quiet||timer)return;
      timer=setTimeout(flush,PUSH_DELAY);
    }
  };
})();
