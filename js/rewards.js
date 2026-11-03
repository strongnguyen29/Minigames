/* ============ Phần thưởng ============ */
const STICKERS=['🐶','🐱','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦉','🦄','🐝','🦋','🐢','🐙','🐬','🐳','🦒','🐘','🦖','🚀','🌈','🍭','🏆','🦕','🦈','🦜','🦩','🦔','🐿️','🦥','🦦','🐞','🦀','🐠','🦓','🐊','🐲','🛸','🎠','🍦','🍩','🧁','🍓','🎈','🎸','⚽','🌻'];
const AVATARS=['🐱','🐶','🐰','🦊','🐼','🐯','🦄','🐸'];
/* Đếm số mức theo điều kiện sao (best có dạng 'game-level' → số sao) */
const bestVals=s=>Object.values(s.best||{});
const levelsWith=(s,min)=>bestVals(s).filter(v=>v>=min).length;
const gameLevelsWith=(s,g,min)=>Object.keys(s.best||{}).filter(k=>k.startsWith(g+'-')&&s.best[k]>=min).length;
const gameDone=(s,g,min)=>gameLevelsWith(s,g,min)>=GAMES[g].levels.length;
const BADGES=[
  {id:'first',icon:'🌱',name:'Bước đầu tiên',desc:'Hoàn thành 1 màn chơi',ok:s=>s.rounds>=1},
  {id:'ten',icon:'🎒',name:'Bạn chăm chỉ',desc:'Hoàn thành 10 màn',ok:s=>s.rounds>=10},
  {id:'r30',icon:'📚',name:'Học trò siêu cấp',desc:'Hoàn thành 30 màn',ok:s=>s.rounds>=30},
  {id:'r100',icon:'🎓',name:'Bác học nhí',desc:'Hoàn thành 100 màn',ok:s=>s.rounds>=100},
  {id:'perf',icon:'💯',name:'Không sai câu nào',desc:'Đạt 3 sao với 0 lỗi',ok:s=>s.perfect>=1},
  {id:'perf5',icon:'🎯',name:'Xạ thủ chính xác',desc:'5 lần không sai câu nào',ok:s=>s.perfect>=5},
  {id:'perf20',icon:'🧠',name:'Thiên tài toán',desc:'20 lần không sai câu nào',ok:s=>s.perfect>=20},
  {id:'st3',icon:'🔥',name:'Học 3 ngày liền',desc:'Chơi 3 ngày liên tiếp',ok:s=>s.streak>=3},
  {id:'st7',icon:'🌟',name:'Tuần lễ vàng',desc:'Chơi 7 ngày liên tiếp',ok:s=>s.streak>=7},
  {id:'st14',icon:'☄️',name:'Kiên trì tuyệt vời',desc:'Chơi 14 ngày liên tiếp',ok:s=>s.streak>=14},
  {id:'s50',icon:'⭐',name:'50 ngôi sao',desc:'Thu thập 50 sao',ok:s=>s.stars>=50},
  {id:'s150',icon:'🌠',name:'150 ngôi sao',desc:'Thu thập 150 sao',ok:s=>s.stars>=150},
  {id:'s300',icon:'🌌',name:'Dải ngân hà',desc:'Thu thập 300 sao',ok:s=>s.stars>=300},
  {id:'stk',icon:'👑',name:'Nhà sưu tập',desc:'Có 10 hình dán',ok:s=>s.stickers.length>=10},
  {id:'stk25',icon:'🎨',name:'Album đầy ắp',desc:'Có 25 hình dán',ok:s=>s.stickers.length>=25},
  {id:'all',icon:'🏆',name:'Vua sưu tập',desc:'Có tất cả hình dán',ok:s=>s.stickers.length>=STICKERS.length},
  {id:'lv3',icon:'🥉',name:'Ba sao đầu tiên',desc:'Đạt 3 sao ở 1 mức',ok:s=>levelsWith(s,3)>=1},
  {id:'lv10',icon:'🥈',name:'Mười mức 3 sao',desc:'Đạt 3 sao ở 10 mức',ok:s=>levelsWith(s,3)>=10},
  {id:'lv30',icon:'🥇',name:'Nhà vô địch',desc:'Đạt 3 sao ở tất cả các mức',ok:s=>levelsWith(s,3)>=Object.values(GAMES).reduce((a,g)=>a+g.levels.length,0)},
  {id:'gcount',icon:'🔢',name:'Chuyên gia đếm hình',desc:'Qua hết mức Đếm hình (≥2 sao)',ok:s=>gameDone(s,'count',2)},
  {id:'gshape',icon:'🔺',name:'Thám tử hình học',desc:'Qua hết mức Nhận biết hình (≥2 sao)',ok:s=>gameDone(s,'shape',2)},
  {id:'gadd',icon:'➕',name:'Phù thủy gộp số',desc:'Qua hết mức Gộp số (≥2 sao)',ok:s=>gameDone(s,'add',2)},
  {id:'gsplit',icon:'✂️',name:'Thợ cắt số',desc:'Qua hết mức Tách số (≥2 sao)',ok:s=>gameDone(s,'split',2)},
  {id:'gcmp',icon:'⚖️',name:'Thẩm phán so sánh',desc:'Qua hết mức So sánh số (≥2 sao)',ok:s=>gameDone(s,'cmp',2)},
  {id:'gpat',icon:'🧩',name:'Thám tử quy luật',desc:'Qua hết mức Quy luật (≥2 sao)',ok:s=>gameDone(s,'pattern',2)},
  {id:'allg',icon:'🌈',name:'Bạn giỏi toàn diện',desc:'Chơi đủ tất cả trò chơi',ok:s=>Object.keys(GAMES).every(g=>gameLevelsWith(s,g,1)>=1)}
];
function checkBadges(){
  const gained=[];
  BADGES.forEach(b=>{if(!S.badges.includes(b.id)&&b.ok(S)){S.badges.push(b.id);gained.push(b)}});
  return gained;
}

