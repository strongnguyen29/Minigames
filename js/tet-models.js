/* Bộ model làng Tết dựng bằng khối cơ bản của Three.js (chibi, flatShading).
   tetKit(THREE) tạo MỘT bộ material + geometry dùng chung cho lần vào làng đó (world giải phóng khi rời làng,
   nên không giữ cache toàn cục). Mỗi hàm trả THREE.Group: gốc ở mặt đất (y=0), mặt trước nhìn về +z.
   Thước đo: người cao TK_MAN = W3_SNOW_H*1.25 (bằng nhân vật làng Noel sau khi phóng), dựng sẵn đúng cỡ, không cần scale. */

const TK_MAN = (typeof W3_SNOW_H !== 'undefined' ? W3_SNOW_H : 1.06) * 1.25;   // ≈1.33
const TK_C = {
  tile: 0xc9412f, red: 0xe53935, gold: 0xf5c542, peach: 0xff9fbf, peachLt: 0xffc8d8, leafBanh: 0x3f8f3a,
  wall: 0xf4e1b5, wood: 0x8a5a3b, woodDk: 0x5e3b25, ridge: 0x8f2a1e, stone: 0xb9b2a6, white: 0xffffff,
  black: 0x2a2a2a, skin: 0xffd2b0, green: 0x4caf50, greenDk: 0x2e7d32, orange: 0xff9800, straw: 0xe9d39a,
  string: 0xf3e6c4, brown: 0x7a4e2d, bamboo: 0x8bc34a, pink: 0xf28b82, horn: 0xd9c49a, melon: 0x2f6b2a, melonIn: 0xff5252
};

function tetKit(THREE) {
  const mats = {}, geos = {};
  /* một material cho mỗi màu (và mỗi tuỳ chọn), dùng chung trong kit */
  const M = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8, flatShading: true }, o))); };
  const G = (type, ...a) => { const k = type + a.join(','); return geos[k] || (geos[k] = new THREE[type](...a)); };
  const FIRE = { emissive: 0xff5a00, emissiveIntensity: .9 };

  /* thêm mesh vào nhóm p; s: [sx,sy,sz] hoặc số, r: [rx,ry,rz] */
  function mesh(p, geo, mat, x, y, z, s, r) {
    const o = new THREE.Mesh(geo, typeof mat === 'number' ? M(mat) : mat);
    o.position.set(x, y, z);
    if (s != null) typeof s === 'number' ? o.scale.setScalar(s) : o.scale.set(s[0], s[1], s[2]);
    if (r) o.rotation.set(r[0], r[1], r[2]);
    p.add(o); return o;
  }
  /* khối hình học cơ bản (geometry đơn vị, phóng theo kích thước để dùng lại tối đa) */
  const box = (p, w, h, d, c, x, y, z, r) => mesh(p, G('BoxGeometry', 1, 1, 1), c, x, y, z, [w, h, d], r);
  const ball = (p, rad, c, x, y, z, s, r) => mesh(p, G('SphereGeometry', 1, 8, 6), c, x, y, z, s ? [rad * s[0], rad * s[1], rad * s[2]] : rad, r);
  const blob = (p, rad, c, x, y, z, s) => mesh(p, G('IcosahedronGeometry', 1, 0), c, x, y, z, s ? [rad * s[0], rad * s[1], rad * s[2]] : rad);
  const cyl = (p, rt, rb, h, c, x, y, z, seg = 8, r) => mesh(p, G('CylinderGeometry', rt, rb, h, seg), c, x, y, z, null, r);
  const cone = (p, rad, h, c, x, y, z, seg = 8, r) => mesh(p, G('ConeGeometry', 1, 1, seg), c, x, y, z, [rad, h, rad], r);

  /* mái ngói kiểu Việt: khối chóp cụt 4 mặt, bờ nóc sẫm, hai đầu nóc và bốn góc đao cong vểnh lên */
  function roof(p, w, d, h, y, c = TK_C.tile) {
    const k = Math.SQRT2;
    /* xoay 45° bên trong rồi mới phóng theo w×d ở nhóm ngoài, kẻo mái bị xô lệch */
    const wrap = new THREE.Group(); wrap.position.set(0, y + h / 2, 0); wrap.scale.set(w / k, h, d / k); p.add(wrap);
    mesh(wrap, G('CylinderGeometry', .22, 1, 1, 4), c, 0, 0, 0, null, [0, Math.PI / 4, 0]);
    box(p, w * .78, h * .16, d * .14, TK_C.ridge, 0, y + h + h * .02, 0);
    for (const s of [-1, 1]) {
      cone(p, h * .12, h * .45, TK_C.ridge, s * w * .4, y + h * 1.12, 0, 6, [0, 0, -s * .7]);
      for (const t of [-1, 1]) cone(p, Math.min(w, d) * .05, Math.min(w, d) * .2, TK_C.ridge, s * w * .49, y + .04, t * d * .49, 6, [t * 1.0, 0, -s * 1.0]);
    }
    box(p, w * 1.0, .06, d * 1.0, TK_C.ridge, 0, y + .02, 0);   // viền diềm mái
  }
  /* đèn lồng đỏ tròn có chóp vàng và tua (cao ≈ 2.6*r), tâm ở (x,y,z) */
  function lantern(p, r, x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
    ball(g, r, TK_C.red, 0, 0, 0, [1, .85, 1]);
    for (const s of [-1, 1]) cyl(g, r * .5, r * .5, r * .22, TK_C.gold, 0, s * r * .85, 0, 8);
    cyl(g, r * .08, r * .08, r * .7, TK_C.gold, 0, -r * 1.3, 0, 5);
    return g;
  }
  /* bánh chưng vuông xanh buộc lạt (cạnh a, dày h), đáy ở y */
  function banh(p, a, h, x, y, z, ry = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
    box(g, a, h, a, TK_C.leafBanh, 0, h / 2, 0);
    for (const o of [-.22, .22]) {
      box(g, a * 1.02, h * 1.02, a * .07, TK_C.string, 0, h / 2, o * a);
      box(g, a * .07, h * 1.02, a * 1.02, TK_C.string, o * a, h / 2, 0);
    }
    return g;
  }
  /* chậu sành (đáy y=0) */
  const potBase = (p, r, h, c = TK_C.tile) => { cyl(p, r, r * .75, h, c, 0, h / 2, 0, 8); cyl(p, r * 1.05, r * 1.05, h * .14, TK_C.gold, 0, h * .9, 0, 8); };
  /* cây hoa: thân, vài cành, chùm hoa */
  function blossomTree(colors, h, spread, n) {
    const g = new THREE.Group();
    cyl(g, .08, .13, h * .5, TK_C.woodDk, 0, h * .25, 0, 6);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + .4;
      cyl(g, .03, .06, h * .4, TK_C.woodDk, Math.cos(a) * .18, h * .55, Math.sin(a) * .18, 5, [Math.sin(a) * .6, 0, -Math.cos(a) * .6]);
    }
    for (let i = 0; i < n; i++) {
      const a = i * 2.4, rr = i ? spread * (.55 + .2 * (i % 2)) : 0, y = h * (.72 + .12 * ((i * 7) % 3) / 2) + (i ? 0 : h * .08);
      blob(g, spread * (i ? .42 : .55), colors[i % colors.length], Math.cos(a) * rr, y, Math.sin(a) * rr);
    }
    return g;
  }

  const kit = {
    C: TK_C, MAN: TK_MAN,

    /* nhà mái ngói đỏ, nền 4×3, cao ≈ 2.8; hiên cột gỗ phía trước */
    house() {
      const g = new THREE.Group();
      box(g, 4, .16, 3, TK_C.stone, 0, .08, 0);
      box(g, 3.4, 1.3, 2.2, TK_C.wall, 0, .81, -.2);
      for (const x of [-1.75, -.6, .6, 1.75]) cyl(g, .07, .08, 1.3, TK_C.wood, x, .81, 1.15, 6);
      box(g, .7, 1.0, .06, TK_C.woodDk, 0, .66, .92);                       // cửa
      for (const s of [-1, 1]) {
        box(g, .6, .45, .06, TK_C.wood, s * 1.05, .9, .92);                 // cửa sổ
        box(g, .14, .8, .03, TK_C.red, s * .52, .82, .95);                  // câu đối đỏ hai bên cửa
        box(g, .07, .07, .02, TK_C.gold, s * .52, 1.05, .97);
        box(g, .07, .07, .02, TK_C.gold, s * .52, .82, .97);
        box(g, .07, .07, .02, TK_C.gold, s * .52, .59, .97);
        lantern(g, .14, s * 1.15, 1.18, 1.2);
      }
      roof(g, 4.4, 3.4, 1.15, 1.46);
      return g;
    },

    /* sạp chợ mái đỏ, nền ≈ 2×1.3 (mái 2.3×1.6), cao ≈ 2.2; goods: fruit|banh|flower|lantern|couplet */
    stall(goods) {
      const g = new THREE.Group(), top = .72;
      for (const x of [-.9, .9]) for (const z of [-.55, .55]) cyl(g, .05, .05, 1.65, TK_C.wood, x, .82, z, 6);
      box(g, 1.9, top, .8, TK_C.wood, 0, top / 2, .15);
      box(g, 1.92, .16, .82, TK_C.red, 0, top - .12, .16);                  // diềm đỏ quanh mặt sạp
      box(g, 1.8, .9, .5, TK_C.woodDk, 0, .45, -.45);                        // kệ sau
      roof(g, 2.3, 1.6, .55, 1.62);
      const tick = [];
      if (goods === 'fruit') {
        for (const x of [-.6, .05]) ball(g, .2, TK_C.melon, x, top + .17, .15, [1, .9, 1.15]);
        ball(g, .2, TK_C.melonIn, .48, top + .1, .18, [1, .5, 1.15]);       // dưa bổ đôi
        for (let i = 0; i < 6; i++) ball(g, .08, TK_C.orange, -.75 + i * .3, .98, -.45);
      } else if (goods === 'banh') {
        for (let i = 0; i < 3; i++) banh(g, .34, .16, -.55 + i * .55, top, .15, i * .2);
        banh(g, .34, .16, -.27, top + .16, .15, .4);
        for (let i = 0; i < 4; i++) banh(g, .3, .14, -.6 + i * .4, .9, -.45);
      } else if (goods === 'flower') {
        const f = [TK_C.peach, TK_C.gold, TK_C.red, TK_C.peachLt];
        for (let i = 0; i < 4; i++) {
          const x = -.66 + i * .44;
          cyl(g, .1, .08, .16, TK_C.tile, x, top + .08, .15, 6);
          blob(g, .17, f[i], x, top + .3, .15);
        }
        for (let i = 0; i < 5; i++) blob(g, .12, f[(i + 1) % 4], -.7 + i * .35, 1.0, -.45);
      } else if (goods === 'lantern') {
        for (let i = 0; i < 4; i++) {
          const pv = new THREE.Group(); pv.position.set(-.75 + i * .5, 1.6, .5); g.add(pv);
          box(pv, .02, .2, .02, TK_C.black, 0, -.1, 0);
          lantern(pv, .13, 0, -.38, 0); tick.push(pv);
        }
        for (const x of [-.45, .1, .55]) lantern(g, .11, x, top + .14, .15);
      } else if (goods === 'couplet') {
        for (let i = 0; i < 3; i++) {                                        // tờ câu đối trải trên sạp
          const x = -.55 + i * .5;
          box(g, .34, .02, .6, TK_C.red, x, top + .01, .15, [0, (i - 1) * .15, 0]);
          for (let j = 0; j < 3; j++) box(g, .12, .012, .12, TK_C.gold, x + (i - 1) * j * .02, top + .025, -.03 + j * .18);
        }
        for (const s of [-1, 1]) {                                           // đôi câu đối dựng hai bên sạp
          box(g, .24, .9, .03, TK_C.red, s * 1.22, .6, .55);
          for (let j = 0; j < 4; j++) box(g, .1, .1, .02, TK_C.gold, s * 1.22, .9 - j * .2, .57);
        }
        cyl(g, .025, .025, .3, TK_C.black, .5, top + .04, .25, 5, [0, 0, Math.PI / 2]);   // bút lông
      }
      if (tick.length) g.userData.tick = t => tick.forEach((o, i) => { o.rotation.z = Math.sin(t * 1.8 + i) * .12; });
      return g;
    },

    /* cổng chào mái ngói hai tầng, rộng ≈ 5.4 (lối đi giữa hai cột ≈ 3.8), cao ≈ 4; bảng đỏ chữ vàng lấy từ text */
    gate(text) {
      const g = new THREE.Group(), W = 4.2;
      for (const s of [-1, 1]) {
        cyl(g, .16, .2, 2.9, TK_C.red, s * W / 2, 1.45, 0, 8);
        box(g, .55, .3, .55, TK_C.stone, s * W / 2, .15, 0);
        box(g, .2, 1.3, .03, TK_C.red, s * W / 2, 1.4, .22);              // câu đối trên cột
        for (let j = 0; j < 4; j++) box(g, .1, .1, .02, TK_C.gold, s * W / 2, 1.88 - j * .32, .24);
      }
      box(g, W + .5, .22, .32, TK_C.wood, 0, 2.6, 0);
      box(g, W + .3, .14, .28, TK_C.wood, 0, 1.68, 0);
      for (const s of [-1, 1]) box(g, .08, .5, .08, TK_C.wood, s * 1.3, 2.1, .2);
      box(g, 2.9, .62, .1, TK_C.red, 0, 2.06, .26);   // bảng thấp hơn mái và nhô ra trước để camera trên cao vẫn đọc được
      const c = document.createElement('canvas'); c.width = 512; c.height = 112;
      const x = c.getContext('2d'), s = String(text == null ? '' : text);
      x.fillStyle = '#e53935'; x.fillRect(0, 0, 512, 112);
      x.strokeStyle = '#f5c542'; x.lineWidth = 8; x.strokeRect(8, 8, 496, 96);
      let fs = 70; x.font = `bold ${fs}px sans-serif`;
      const tw = (x.measureText(s) || {}).width || 0;
      if (tw > 470) { fs = Math.floor(fs * 470 / tw); x.font = `bold ${fs}px sans-serif`; }
      x.fillStyle = '#ffe066'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 256, 60);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      mesh(g, new THREE.PlaneGeometry(2.7, .59), new THREE.MeshBasicMaterial({ map: tex }), 0, 2.06, .32);
      const r1 = new THREE.Group(); r1.position.y = 2.7; g.add(r1); roof(r1, 5.4, 1.1, .6, 0);
      const r2 = new THREE.Group(); r2.position.y = 3.25; g.add(r2); box(r2, .9, .3, .5, TK_C.wood, 0, .05, 0); roof(r2, 2.2, 1.0, .5, .2);
      for (const s2 of [-1, 1]) lantern(g, .16, s2 * 1.7, 1.4, .05);
      return g;
    },

    /* dây đèn lồng dài len (mặc định 6) căng giữa hai cột cao 2.4, dọc trục x, tâm ở gốc */
    lanternString(len = 6) {
      const g = new THREE.Group(), H = 2.4, n = Math.max(2, Math.round(len / .8)), sway = [];
      for (const s of [-1, 1]) cyl(g, .05, .06, H, TK_C.wood, s * len / 2, H / 2, 0, 6);
      box(g, len, .025, .025, TK_C.ridge, 0, H - .1, 0);
      for (let i = 1; i < n; i++) {
        const pv = new THREE.Group(); pv.position.set(-len / 2 + i * len / n, H - .1, 0); g.add(pv);
        box(pv, .015, .14, .015, TK_C.black, 0, -.07, 0);
        lantern(pv, .13, 0, -.3, 0); sway.push(pv);
      }
      g.userData.tick = t => sway.forEach((o, i) => { o.rotation.z = Math.sin(t * 1.6 + i * .9) * .1; });
      return g;
    },

    /* cây đào hồng, cao ≈ 2.4, tán rộng ≈ 1.8 */
    peach() { return blossomTree([TK_C.peach, TK_C.peachLt, TK_C.peach], 2.4, .9, 6); },
    /* cây mai vàng, cao ≈ 2.1, tán ≈ 1.5 */
    apricot() {
      const g = blossomTree([TK_C.gold, 0xffdd55, TK_C.gold], 2.1, .75, 6);
      for (let i = 0; i < 6; i++) { const a = i * 1.05; blob(g, .1, TK_C.green, Math.cos(a) * .7, 1.55 + (i % 2) * .3, Math.sin(a) * .7); }
      return g;
    },
    /* chậu quất, cao ≈ 1.1, chậu r=.3 */
    kumquat() {
      const g = new THREE.Group();
      potBase(g, .3, .36);
      cyl(g, .04, .05, .3, TK_C.woodDk, 0, .5, 0, 5);
      blob(g, .38, TK_C.greenDk, 0, .78, 0, [1, .95, 1]);
      for (let i = 0; i < 10; i++) {
        const a = i * 2.39, y = .62 + (i % 4) * .1, rr = .36 - Math.abs(y - .78) * .6;
        ball(g, .055, TK_C.orange, Math.cos(a) * rr, y, Math.sin(a) * rr);
      }
      box(g, .08, .13, .02, TK_C.red, .2, .66, .3);                        // thiếp lì xì treo
      return g;
    },
    /* bụi tre 4 cây, cao ≈ 3.6, gốc ≈ .7 */
    bamboo() {
      const g = new THREE.Group();
      [[0, 0, 3.6], [.3, .15, 3.1], [-.25, .2, 3.3], [.05, -.3, 2.8]].forEach(([x, z, h], i) => {
        const tilt = [0, .08, -.07, .05][i];
        const st = new THREE.Group(); st.position.set(x, 0, z); st.rotation.z = tilt; st.rotation.x = tilt * .7; g.add(st);
        cyl(st, .05, .06, h, TK_C.bamboo, 0, h / 2, 0, 6);
        for (let y = .6; y < h - .2; y += .6) cyl(st, .065, .065, .04, TK_C.greenDk, 0, y, 0, 6);
        for (let k = 0; k < 3; k++) cone(st, .1, .55, TK_C.green, Math.cos(k * 2.1) * .18, h - .1 - k * .3, Math.sin(k * 2.1) * .18, 4, [Math.sin(k * 2.1) * .9, 0, -Math.cos(k * 2.1) * .9]);
      });
      return g;
    },
    /* cây xanh tròn ở rìa làng, cao ≈ 3, tán ≈ 2 */
    tree() {
      const g = new THREE.Group();
      cyl(g, .12, .18, 1.2, TK_C.woodDk, 0, .6, 0, 6);
      blob(g, 1.0, TK_C.green, 0, 1.75, 0, [1, .85, 1]);
      blob(g, .7, TK_C.greenDk, .35, 2.35, -.1);
      blob(g, .55, TK_C.green, -.3, 2.55, .15);
      return g;
    },
    /* nồi bánh chưng trên bếp lửa, rộng ≈ 1.1, cao ≈ 1; lửa lập loè qua userData.tick */
    pot() {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) { const a = i * 2.09 + .5; blob(g, .17, TK_C.stone, Math.cos(a) * .42, .14, Math.sin(a) * .42, [1, .8, 1]); }
      for (let i = 0; i < 3; i++) cyl(g, .05, .05, .9, TK_C.woodDk, 0, .06, 0, 5, [Math.PI / 2, i * 1.05, 0]).position.set(Math.sin(i * 1.05) * .2, .06, Math.cos(i * 1.05) * .2);
      const fire = new THREE.Group(); g.add(fire);
      cone(fire, .2, .45, M(0xff7a1a, FIRE), 0, .3, 0, 6);
      for (let i = 0; i < 5; i++) {                                          // lưỡi lửa thò ra quanh đáy nồi
        const a = i * 1.26 + .3;
        cone(fire, .1, .32, M(i % 2 ? TK_C.gold : 0xff7a1a, FIRE), Math.cos(a) * .42, .22, Math.sin(a) * .42, 5);
      }
      cyl(g, .45, .38, .5, 0x3a3a3a, 0, .55, 0, 8);
      cyl(g, .48, .48, .06, 0x555555, 0, .8, 0, 8);
      for (let i = 0; i < 4; i++) box(g, .3, .02, .14, TK_C.leafBanh, Math.cos(i * 1.57) * .3, .84, Math.sin(i * 1.57) * .3, [0, i * 1.57, .4]);
      cyl(g, .4, .44, .05, 0x555555, 0, .86, 0, 8);
      ball(g, .06, TK_C.black, 0, .92, 0);
      g.userData.tick = t => {
        const f = 1 + Math.sin(t * 13) * .12 + Math.sin(t * 7.3) * .08;
        fire.scale.set(1 + Math.sin(t * 9) * .05, f, 1 + Math.cos(t * 11) * .05);
      };
      return g;
    },
    /* chồng bánh chưng trên nia tre, nền ≈ .9, cao ≈ .5 */
    banhStack() {
      const g = new THREE.Group();
      cyl(g, .45, .45, .05, TK_C.straw, 0, .025, 0, 10);
      for (const [x, z] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) banh(g, .34, .15, x, .05, z);
      banh(g, .34, .15, 0, .2, 0, .3);
      banh(g, .3, .13, 0, .35, 0, .8);
      return g;
    },
    /* sân khấu múa lân: bục đỏ 3.2×2.2 cao .45, phông nền cao ≈ 2.4 phía sau, trống bên trái, cờ hai góc */
    stage() {
      const g = new THREE.Group();
      box(g, 3.2, .45, 2.2, TK_C.red, 0, .225, 0);
      box(g, 3.26, .08, 2.26, TK_C.gold, 0, .45, 0);
      box(g, 1, .2, .4, TK_C.wood, 0, .1, 1.3);                             // bậc lên
      box(g, 3.2, 1.9, .12, TK_C.tile, 0, 1.4, -1.05);
      box(g, 3.3, .14, .2, TK_C.gold, 0, 2.38, -1.05);
      cyl(g, .5, .5, .03, TK_C.gold, 0, 1.45, -.98, 12, [Math.PI / 2, 0, 0]);
      cyl(g, .4, .4, .035, TK_C.red, 0, 1.45, -.97, 12, [Math.PI / 2, 0, 0]);
      for (const s of [-1, 1]) {
        blob(g, .22, TK_C.peach, s * 1.1, 1.9, -.97, [1, 1, .3]);
        blob(g, .18, TK_C.gold, s * 1.1, 1.0, -.97, [1, 1, .3]);
        cyl(g, .03, .03, 2.3, TK_C.wood, s * 1.55, 1.6, .95, 5);
        mesh(g, G('ConeGeometry', 1, 1, 3), s < 0 ? TK_C.gold : TK_C.red, s * 1.55 + s * .25, 2.55, .95, [.25, .5, .05], [0, 0, s * Math.PI / 2]);
      }
      /* trống: giá gỗ, mặt trống nghiêng về phía camera */
      for (const s of [-1, 1]) cyl(g, .03, .03, .55, TK_C.wood, -1.05 + s * .32, .72, .3, 5, [0, 0, s * .3]);
      const drum = new THREE.Group(); drum.position.set(-1.05, 1.05, .3); drum.rotation.x = .9; g.add(drum);
      cyl(drum, .36, .36, .42, TK_C.red, 0, 0, 0, 10);
      for (const s of [-1, 1]) cyl(drum, .33, .33, .02, TK_C.straw, 0, s * .21, 0, 10);
      cyl(drum, .37, .37, .05, TK_C.gold, 0, 0, 0, 10);
      return g;
    },
    /* bàn thờ gia tiên nhỏ để trang trí: bàn gỗ 1.2×.55 cao .8, mâm quả, bình mai, bánh chưng */
    altar() {
      const g = new THREE.Group();
      box(g, 1.2, .08, .55, TK_C.woodDk, 0, .76, 0);
      for (const x of [-.55, .55]) for (const z of [-.22, .22]) box(g, .07, .72, .07, TK_C.woodDk, x, .36, z);
      box(g, 1.1, .45, .02, TK_C.red, 0, .52, .27);
      box(g, .5, .06, .02, TK_C.gold, 0, .6, .285);
      cyl(g, .18, .1, .08, TK_C.gold, 0, .84, .05, 8);
      [[TK_C.orange, -.08, .04], [TK_C.green, .07, .06], [TK_C.red, 0, -.04], [TK_C.gold, .02, .12]].forEach(([c, x, z]) => ball(g, .07, c, x, .93, .05 + z));
      for (const s of [-1, 1]) {
        cyl(g, .06, .08, .28, 0x3f6fb5, s * .45, .94, -.05, 6);
        cyl(g, .01, .015, .28, TK_C.woodDk, s * .45, 1.2, -.05, 4);
        for (let i = 0; i < 4; i++) ball(g, .045, TK_C.gold, s * .45 + Math.cos(i * 1.6) * .09, 1.22 + i * .05, -.05 + Math.sin(i * 1.6) * .06);
      }
      banh(g, .2, .1, .25, .8, .1, .3);
      return g;
    },

    /* ── nhân vật, cao ≈ TK_MAN (dê ≈ .95) ── */
    /* Ông đồ: áo dài the nâu, khăn xếp đen, râu tóc bạc, tay cầm cuộn giấy đỏ */
    ongdo() {
      const g = new THREE.Group();
      for (const s of [-1, 1]) box(g, .14, .08, .2, TK_C.black, s * .1, .04, .03);
      cyl(g, .13, .13, .14, TK_C.white, 0, .1, 0, 8);                        // quần trắng
      cyl(g, .21, .33, .68, TK_C.brown, 0, .5, 0, 8);                       // áo dài
      cyl(g, .23, .23, .06, 0x5e3a1f, 0, .62, 0, 8);
      cyl(g, .09, .11, .06, TK_C.white, 0, .86, 0, 8);                      // cổ áo
      for (const s of [-1, 1]) {
        cyl(g, .08, .12, .36, TK_C.brown, s * .28, .58, .04, 6, [.4, 0, s * .35]);
        ball(g, .06, TK_C.skin, s * .3, .44, .26);
      }
      cyl(g, .045, .045, .5, TK_C.red, 0, .44, .3, 6, [0, 0, Math.PI / 2]);   // cuộn giấy đỏ
      for (const s of [-1, 1]) cyl(g, .05, .05, .04, TK_C.gold, s * .26, .44, .3, 6, [0, 0, Math.PI / 2]);
      ball(g, .25, TK_C.skin, 0, 1.06, 0);
      cone(g, .16, .3, TK_C.white, 0, .78, .13, 6, [Math.PI + .25, 0, 0]);   // râu bạc
      ball(g, .14, TK_C.white, 0, .93, .14, [1, .45, .7]);                  // ria
      for (const s of [-1, 1]) {
        box(g, .09, .025, .02, TK_C.white, s * .09, 1.15, .22);             // lông mày bạc
        ball(g, .025, TK_C.black, s * .09, 1.09, .23);
        ball(g, .05, TK_C.white, s * .23, 1.02, -.04);                     // tóc mai bạc
      }
      ball(g, .04, TK_C.pink, 0, 1.03, .25);
      cyl(g, .265, .27, .14, TK_C.black, 0, 1.24, -.01, 10);               // khăn xếp
      cyl(g, .275, .275, .03, 0x444444, 0, 1.2, -.01, 10);
      cyl(g, .275, .275, .03, 0x444444, 0, 1.27, -.01, 10);
      cyl(g, .2, .24, .05, TK_C.black, 0, 1.33, -.01, 10);
      return g;
    },
    /* Cô bán hàng: áo dài đỏ, quần trắng, nón lá, xách giỏ quất */
    seller() {
      const g = new THREE.Group();
      for (const s of [-1, 1]) box(g, .12, .06, .18, TK_C.black, s * .08, .03, .03);
      cyl(g, .16, .2, .34, TK_C.white, 0, .2, 0, 8);
      box(g, .3, .5, .04, TK_C.red, 0, .42, .15, [-.12, 0, 0]);             // tà trước
      box(g, .3, .5, .04, TK_C.red, 0, .42, -.15, [.12, 0, 0]);             // tà sau
      cyl(g, .16, .22, .4, TK_C.red, 0, .68, 0, 8);
      cyl(g, .07, .09, .08, TK_C.red, 0, .9, 0, 8);
      for (const s of [-1, 1]) {
        cyl(g, .055, .07, .34, TK_C.red, s * .23, .7, 0, 6, [0, 0, s * .3]);
        ball(g, .05, TK_C.skin, s * .29, .54, .02);
      }
      cyl(g, .12, .09, .14, TK_C.straw, .34, .42, .06, 8);                 // giỏ
      for (let i = 0; i < 3; i++) ball(g, .045, TK_C.orange, .3 + i * .04, .5, .03 + (i % 2) * .05);
      ball(g, .23, TK_C.skin, 0, 1.06, 0);
      ball(g, .24, TK_C.black, 0, 1.1, -.05, [1, .95, .95]);               // tóc
      ball(g, .12, TK_C.black, 0, .92, -.2, [1, 1.6, .8]);                 // tóc dài sau lưng
      for (const s of [-1, 1]) { ball(g, .028, TK_C.black, s * .08, 1.06, .21); ball(g, .04, TK_C.pink, s * .14, .99, .18); }
      cone(g, .44, .28, TK_C.straw, 0, 1.19, 0, 10);                       // nón lá
      cyl(g, .3, .3, .02, 0xd8be7c, 0, 1.13, 0, 10);
      box(g, .015, .2, .015, TK_C.red, .2, 1.0, .1);                         // quai nón
      return g;
    },
    /* Chú Lân: đầu to tròn đỏ vàng, mắt to, viền lông xù, sừng nhỏ; thân vải phía sau, hai người múa (chân vàng) */
    lion() {
      const g = new THREE.Group();
      for (const [x, z] of [[-.13, .12], [.13, .12], [-.13, -.62], [.13, -.62]]) {
        cyl(g, .065, .07, .34, TK_C.gold, x, .2, z, 6);
        box(g, .13, .07, .18, TK_C.red, x, .035, z + .03);
      }
      ball(g, .3, TK_C.gold, 0, .55, -.45, [1, .9, 1.6]);                  // thân vải
      for (let i = 0; i < 4; i++) ball(g, .1, TK_C.red, 0, .78, -.15 - i * .2, [1.4, .6, 1]);
      for (let i = 0; i < 7; i++) blob(g, .07, TK_C.white, (i - 3) * .09, .32, -.45 + Math.abs(i - 3) * .03);
      const head = new THREE.Group(); head.position.set(0, .86, .05); g.add(head);
      ball(head, .42, TK_C.red, 0, 0, 0, [1, .95, .95]);
      ball(head, .3, TK_C.gold, 0, -.12, .2, [1.1, .55, .7]);              // mõm vàng
      box(head, .4, .05, .04, TK_C.white, 0, -.2, .4);                      // răng
      ball(head, .1, TK_C.pink, 0, -.03, .43);                             // mũi
      for (const s of [-1, 1]) {
        ball(head, .13, TK_C.white, s * .17, .14, .32);
        ball(head, .065, TK_C.black, s * .17, .14, .43);
        ball(head, .14, TK_C.gold, s * .17, .28, .28, [1.1, .4, .6]);      // mí mắt vàng
        blob(head, .1, TK_C.white, s * .36, .22, .1);                      // tai lông
      }
      cyl(head, .07, .07, .02, 0xdfe7ee, 0, .32, .31, 8, [Math.PI / 2 - .5, 0, 0]);   // gương trán
      cone(head, .06, .16, TK_C.gold, 0, .44, .1, 6, [-.3, 0, 0]);         // sừng
      for (let i = 0; i < 12; i++) {                                         // viền lông xù quanh đầu
        const a = i / 12 * Math.PI * 2;
        blob(head, .09, i % 2 ? TK_C.white : TK_C.gold, Math.cos(a) * .42, Math.sin(a) * .4, -.05);
      }
      return g;
    },
    /* Dê con trắng chibi, sừng nhỏ, khăn đỏ; cao ≈ .95, dài ≈ .9 */
    goat() {
      const g = new THREE.Group();
      for (const [x, z] of [[-.13, .15], [.13, .15], [-.13, -.2], [.13, -.2]]) {
        cyl(g, .05, .05, .26, TK_C.white, x, .17, z, 6);
        cyl(g, .055, .055, .06, 0x6d5a4a, x, .03, z, 6);
      }
      ball(g, .26, TK_C.white, 0, .45, -.02, [1, .9, 1.3]);
      ball(g, .07, TK_C.white, 0, .55, -.36);                               // đuôi
      cyl(g, .14, .16, .07, TK_C.red, 0, .62, .2, 8, [.5, 0, 0]);          // khăn đỏ
      box(g, .1, .14, .03, TK_C.red, .06, .52, .3, [.3, 0, .2]);
      ball(g, .22, TK_C.white, 0, .78, .3);
      ball(g, .12, 0xfff0f0, 0, .72, .48, [1, .8, .8]);                    // mõm
      ball(g, .03, TK_C.pink, 0, .75, .56);
      cone(g, .045, .12, TK_C.white, 0, .56, .44, 5, [Math.PI, 0, 0]);     // chòm râu
      for (const s of [-1, 1]) {
        ball(g, .035, TK_C.black, s * .1, .84, .48);
        ball(g, .04, TK_C.pink, s * .15, .77, .45);
        ball(g, .07, TK_C.white, s * .23, .82, .26, [1.6, .5, .8], [0, 0, -s * .5]);   // tai
        cone(g, .045, .2, TK_C.horn, s * .09, .98, .24, 5, [-.5, 0, s * .25]);          // sừng nhỏ
      }
      return g;
    },

    /* ── đồ để tìm, cao ≈ .5–.7 ── */
    item(id) {
      const g = new THREE.Group();
      if (id === 'lixi') {                                                   // bao lì xì đứng
        box(g, .4, .6, .06, TK_C.red, 0, .3, 0);
        box(g, .4, .14, .065, 0xc62828, 0, .53, 0);
        cyl(g, .1, .1, .02, TK_C.gold, 0, .32, .035, 10, [Math.PI / 2, 0, 0]);
        box(g, .06, .06, .02, TK_C.red, 0, .32, .045, [0, 0, Math.PI / 4]);
      } else if (id === 'banh') {                                            // bánh chưng có nơ lạt
        banh(g, .5, .32, 0, 0, 0);
        for (const s of [-1, 1]) ball(g, .08, TK_C.string, s * .07, .38, 0, [1, .6, .6], [0, 0, s * .5]);
        ball(g, .04, TK_C.string, 0, .36, 0);
      } else if (id === 'quat') {                                            // chùm quất có cành lá
        cyl(g, .02, .025, .3, TK_C.woodDk, 0, .4, 0, 5);
        for (const [x, y, z] of [[-.12, .16, 0], [.12, .18, .03], [0, .3, .08]]) ball(g, .15, TK_C.orange, x, y, z);
        for (const s of [-1, 1]) ball(g, .1, TK_C.greenDk, s * .1, .52, 0, [1.3, .35, .7], [0, 0, s * .5]);
      } else if (id === 'lantern') {                                         // đèn lồng có móc treo
        lantern(g, .2, 0, .32, 0);
        cyl(g, .012, .012, .14, TK_C.black, 0, .58, 0, 4);
        mesh(g, G('TorusGeometry', .04, .012, 4, 8), TK_C.gold, 0, .66, 0);
      } else if (id === 'mai') {                                             // cành mai vàng buộc nơ đỏ
        cyl(g, .025, .035, .62, TK_C.woodDk, 0, .31, 0, 5, [0, 0, .12]);
        for (const s of [-1, 1]) cyl(g, .015, .02, .26, TK_C.woodDk, s * .1, .45, 0, 4, [0, 0, -s * .7]);
        [[0, .66, 0], [-.04, .5, .05], [.2, .52, .02], [-.2, .55, 0], [.1, .36, .04], [-.1, .3, .03], [.05, .58, -.06]]
          .forEach(([x, y, z]) => { ball(g, .06, TK_C.gold, x, y, z, [1, .6, 1]); ball(g, .02, TK_C.orange, x, y + .03, z); });
        box(g, .14, .07, .05, TK_C.red, 0, .12, .02);
      }
      return g;
    }
  };
  return kit;
}
