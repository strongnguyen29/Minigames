/* Làng Tết 3D: dữ liệu Tết, logic dùng chung nằm ở js/village.js */
/* Mọi thứ gắn với năm (năm, can chi, linh vật, chữ trên cổng) chỉ nằm ở đây; năm sau đổi chủ đề thì sửa hằng này */
const TET_YEAR={year:2027,canchi:'Đinh Mùi',animal:'Dê',sign:'Làng Tết 2027'};
const TET_NPCS=[
  {id:'ongdo',name:'Ông đồ'},
  {id:'seller',name:'Cô bán hàng'},
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
/* 14 chỗ giấu (toạ độ tạm, chỉnh lại cho khớp bố cục bản đồ Tết; luôn giữ đúng 14 điểm) */
const TET_SPOTS=[{x:-6,z:4},{x:6,z:3},{x:-9,z:-5},{x:9,z:-6},{x:-18,z:5},{x:18,z:3},{x:-5,z:12},
  {x:12,z:9},{x:-12,z:10},{x:-6,z:-10},{x:7,z:-11},{x:-14,z:-8},{x:15,z:-7},{x:0,z:13}];

const TET_V=makeVillage({id:'tet',field:'tet',npcs:TET_NPCS,items:TET_ITEMS,spots:TET_SPOTS,quiz:()=>TET_QUIZ,seed:20270206});
