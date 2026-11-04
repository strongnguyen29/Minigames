/* ============ Nhạc nền ============ */
/* Phát ở các màn menu (trang chủ, chọn mức, tiệm, bộ sưu tập, kết quả…); tạm dừng khi vào màn chơi và Tiệm âm thanh */
const MUSIC_SRC='audio/music/kuromi-lofi.m4a';
/* nhạc nền nhỏ hơn hẳn giọng Kuromi (giọng phát ở mức 1); khi Kuromi đang nói thì hạ thêm */
const MUSIC_VOL=.7,MUSIC_DUCK_VOL=.3;
const MUSIC_MUTE_SCREENS=['play','caro','radio'];
const music=(()=>{
  let el=null,gain=null,want=false,duckIv=0;
  /* iOS bỏ qua audio.volume → chỉnh âm lượng qua GainNode của Web Audio (ac dùng chung với hiệu ứng).
     Mở thẳng file:// thì trình duyệt coi file nhạc là khác nguồn, Web Audio chỉ nhận im lặng → dùng audio.volume */
  function audio(){
    if(el)return el;
    el=new Audio();el.loop=true;el.src=MUSIC_SRC;
    if(location.protocol==='file:'){el.volume=MUSIC_VOL;return el}
    try{
      ac=ac||new(window.AudioContext||window.webkitAudioContext)();
      gain=ac.createGain();gain.gain.value=MUSIC_VOL;
      ac.createMediaElementSource(el).connect(gain);gain.connect(ac.destination);
    }catch(e){gain=null;el.volume=MUSIC_VOL}
    return el;
  }
  function setVol(v){if(gain)gain.gain.value=v;else if(el)el.volume=v}
  const duck=()=>setVol((typeof voice!=='undefined'&&voice.busy())||(typeof chatRecording==='function'&&chatRecording())?MUSIC_DUCK_VOL:MUSIC_VOL);
  function sync(){
    const on=want&&S.music!==false&&!document.hidden;
    if(!on){clearInterval(duckIv);duckIv=0;if(el)try{el.pause()}catch(e){}return}
    try{ac&&ac.resume&&ac.resume();const p=audio().play();p&&p.catch&&p.catch(()=>{})}catch(e){}
    if(!duckIv)duckIv=setInterval(duck,150);
  }
  document.addEventListener('visibilitychange',sync);
  return{
    /* gọi mỗi lần dựng màn: cls là lớp của màn (xem screenHTML) */
    scene(cls){want=!MUSIC_MUTE_SCREENS.includes(cls);sync()},
    sync
  };
})();
