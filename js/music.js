/* ============ Nhạc nền ============ */
/* Phát ở các màn menu (trang chủ, chọn mức, tiệm, bộ sưu tập, kết quả…); tạm dừng khi vào màn chơi và Tiệm âm thanh */
const MUSIC_SRC='audio/music/kuromi-lofi.m4a';
/* nhạc nền nhỏ hơn hẳn giọng Kuromi (giọng phát ở mức 1); khi Kuromi đang nói thì hạ thêm */
const MUSIC_VOL=.7,MUSIC_DUCK_VOL=.3;
const MUSIC_MUTE_SCREENS=['play','caro','radio'];
const music=(()=>{
  let el=null,gain=null,want=false,duckIv=0;
  const themes={},bad=new Set();let cur=MUSIC_SRC;
  /* iOS bỏ qua audio.volume → chỉnh âm lượng qua GainNode của Web Audio (ac dùng chung với hiệu ứng).
     Mở thẳng file:// thì trình duyệt coi file nhạc là khác nguồn, Web Audio chỉ nhận im lặng → dùng audio.volume */
  function audio(){
    if(el)return el;
    el=new Audio();el.loop=true;
    el.addEventListener('error',()=>{if(cur!==MUSIC_SRC){bad.add(cur);play(MUSIC_SRC)}});
    if(location.protocol==='file:'){el.src=cur;el.volume=MUSIC_VOL;return el}
    /* bài nằm ở CDN khác nguồn: cần crossOrigin (đặt trước src) thì GainNode mới không ra im lặng */
    el.crossOrigin='anonymous';el.src=cur;
    try{
      ac=ac||new(window.AudioContext||window.webkitAudioContext)();
      gain=ac.createGain();gain.gain.value=MUSIC_VOL;
      ac.createMediaElementSource(el).connect(gain);gain.connect(ac.destination);
    }catch(e){gain=null;el.volume=MUSIC_VOL}
    return el;
  }
  /* đổi bài đang dùng; chưa tạo el thì audio() sẽ nạp đúng bài */
  function play(url){
    if(url===cur)return;
    cur=url;
    if(!el)return;
    try{el.pause()}catch(e){}
    el.src=url;try{el.currentTime=0}catch(e){}
  }
  function setVol(v){if(gain)gain.gain.value=v;else if(el)el.volume=v}
  const duck=()=>setVol((typeof voice!=='undefined'&&voice.busy())||(typeof chatAudioBusy==='function'&&chatAudioBusy())?MUSIC_DUCK_VOL:MUSIC_VOL);
  function sync(){
    const on=want&&S.music!==false&&!document.hidden;
    if(!on){clearInterval(duckIv);duckIv=0;if(el)try{el.pause()}catch(e){}return}
    try{ac&&ac.resume&&ac.resume();const p=audio().play();p&&p.catch&&p.catch(()=>{})}catch(e){}
    if(!duckIv)duckIv=setInterval(duck,150);
  }
  document.addEventListener('visibilitychange',sync);
  return{
    /* gọi mỗi lần dựng màn: cls là lớp của màn (xem screenHTML) */
    scene(cls){
      const t=String(cls||'').split(/\s+/).filter(Boolean);
      want=!t.some(c=>MUSIC_MUTE_SCREENS.includes(c));
      const k=t.find(c=>themes[c]&&!bad.has(themes[c]));
      play(k?themes[k]:MUSIC_SRC);
      sync();
    },
    /* nhạc riêng cho màn có lớp token */
    theme(token,url){themes[token]=url},
    src(){return cur},
    sync
  };
})();
