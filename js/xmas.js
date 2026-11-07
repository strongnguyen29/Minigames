/* Làng Giáng Sinh 3D: dữ liệu Noel, logic dùng chung nằm ở js/village.js */
const XMAS_NPCS=[
  {id:'santa',name:'Ông già Noel',model:null},
  {id:'snowman',name:'Người tuyết',model:'snowman-hat'},
  {id:'reindeer',name:'Tuần lộc',model:'reindeer'},
  {id:'nutcracker',name:'Lính chì',model:'nutcracker'}
];
const XMAS_ITEMS=[
  {id:'present',model:'present-a-cube',name:'hộp quà',icon:'🎁'},
  {id:'sock',model:'sock-red',name:'chiếc tất Noel',icon:'🧦'},
  {id:'candy',model:'candy-cane-red',name:'cây kẹo gậy',icon:'🍬'},
  {id:'cookie',model:'gingerbread-man',name:'bánh gừng',icon:'🍪'},
  {id:'flake',model:'snowflake-a',name:'bông tuyết',icon:'❄️'},
  {id:'wreath',model:'wreath-decorated',name:'vòng nguyệt quế',icon:'🎀'}
];
/* 14 chỗ giấu, khớp bố cục XMAS_MAP trong js/xmas-ui.js: ở chỗ trống, không nằm sau nhà hay cây (camera nhìn từ phía nam) */
const XMAS_SPOTS=[{x:-6,z:4},{x:6,z:3},{x:-9,z:-5},{x:9,z:-6},{x:-19,z:5},{x:20,z:3},{x:-5,z:12},
  {x:12,z:9},{x:-12,z:10},{x:-6,z:-10},{x:7,z:-11},{x:-14,z:-8},{x:15,z:-7},{x:0,z:13}];

const XMAS_V=makeVillage({id:'xmas',field:'xmas',npcs:XMAS_NPCS,items:XMAS_ITEMS,spots:XMAS_SPOTS,quiz:()=>XMAS_QUIZ,seed:20261224});
/* bí danh giữ tên cũ cho code và test hiện có */
const xmasRng=vilRng,xmasShuffle=vilShuffle,xmasQuizStars=vilQuizStars,xmasQuizAnswer=vilQuizAnswer;
const xmasPlan=XMAS_V.plan,xmasFresh=XMAS_V.fresh,xmasState=XMAS_V.state,xmasStatus=XMAS_V.status,
  xmasPickup=XMAS_V.pickup,xmasComplete=XMAS_V.complete,xmasProgress=XMAS_V.progress,xmasQuizNew=XMAS_V.quizNew;
const xmasOutfits=vilOutfits,xmasOutfit=vilOutfit,xmasSetOutfit=vilSetOutfit;
const XMAS_OUTFIT_KEY=VIL_OUTFIT_KEY,XMAS_DEFAULT_OUTFIT=VIL_DEFAULT_OUTFIT;
