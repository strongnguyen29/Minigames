/* Làng Tết 3D: dữ liệu Tết, logic dùng chung nằm ở js/village.js */
/* Mọi thứ gắn với năm (năm, can chi, linh vật, chữ trên cổng) chỉ nằm ở đây; năm sau đổi chủ đề thì sửa hằng này */
const TET_YEAR={year:2027,canchi:'Đinh Mùi',animal:'Dê',sign:'Làng Tết 2027'};
const TET_NPCS=[
  {id:'ongdo',name:'Ông đồ',me:'ông',you:'Con'},
  {id:'seller',name:'Cô bán hàng',me:'cô',you:'Con'},
  {id:'lion',name:'Chú Lân'},
  {id:'goat',name:'Dê con'}
];
/* phần dựng model của từng món gắn ở js/tet-models.js */
const TET_ITEMS=[
  {id:'lixi',name:'bao lì xì',icon:'🧧'},
  {id:'banh',name:'chiếc bánh chưng',icon:'🟩'},
  {id:'quat',name:'quả quất',icon:'🍊'},
  {id:'lantern',name:'chiếc đèn lồng',icon:'🏮'},
  {id:'mai',name:'cành mai',icon:'🌼'}
];
/* 14 chỗ giấu ở chỗ trống, nhìn thấy từ camera (không nằm sau nhà, sạp hay sân khấu), khớp bố cục TET_MAP ở js/tet-ui.js; luôn giữ đúng 14 điểm */
const TET_SPOTS=[{x:-7.2,z:3.4},{x:7.4,z:3.8},{x:-9.6,z:-6},{x:9.6,z:-6.4},{x:-15.4,z:6.4},{x:15.4,z:5.4},{x:-4.6,z:6.6},
  {x:11,z:9.4},{x:-11,z:10.2},{x:-3,z:-8.6},{x:4.4,z:-8.8},{x:-12,z:-8.4},{x:20,z:-4.2},{x:5.2,z:12.4}];

const TET_V=makeVillage({id:'tet',field:'tet',npcs:TET_NPCS,items:TET_ITEMS,spots:TET_SPOTS,quiz:()=>TET_QUIZ,seed:20270206});
