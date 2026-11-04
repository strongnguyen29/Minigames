/* ============ Đồng bộ tiến độ lên mây (sao lưu; localStorage vẫn là nơi lưu chính) ============ */
const CLOUD_KEY='be_vui_cloud_v1';
const PUSH_DELAY=3000;
const SWITCH_MSG='Máy này đang có tiến độ của tài khoản khác. Dùng dữ liệu của tài khoản mới (tiến độ trên máy sẽ được thay)?';
/* adapter Firebase thật (Task 3 điền: nạp SDK từ gstatic, Auth Google, Firestore) */
function firebaseAdapter(){return Promise.reject(new Error('chưa cấu hình Firebase'))}
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
    signIn(){
      return ensure().then(a=>{wr({used:true});return a.signIn()}).catch(fail);
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
