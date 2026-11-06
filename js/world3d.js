/* Lõi thế giới 3D dùng chung cho mọi bản đồ: nạp Three.js + model, scene, camera đi theo,
   chạm để đi, va chạm hình tròn, búp bê giấy, nhân vật có dấu trên đầu, đồ vật để nhặt, vòng render.
   Script cổ điển: chỉ chạm tới Three bên trong hàm (import() động), nên nạp vào node vẫn được. */

const W3_SNOW_H = 1.06;      // chiều cao người tuyết trong kit (đo bằng Box3), làm thước đo
const W3_SPEED = 3;          // tốc độ đi của bé (đơn vị/giây)
const W3_RADIUS = .3;        // bán kính va chạm của bé
const W3_CAM = { fov: 40, tilt: 50 * Math.PI / 180, dist: 13 };

/* Đi một bước (dài tối đa step) về phía target; gặp vật cản thì trượt theo mép, kẹt thì đứng yên */
function w3Move(pos, target, step, obstacles, bound, radius) {
  const dx = target.x - pos.x, dz = target.z - pos.z, d = Math.hypot(dx, dz);
  if (d <= .05) return { x: pos.x, z: pos.z, arrived: true };
  const k = Math.min(step, d) / d;
  let x = pos.x + dx * k, z = pos.z + dz * k;
  const ex = Math.max(.01, bound.rx - radius), ez = Math.max(.01, bound.rz - radius);
  const inBound = (x, z) => (x / ex) ** 2 + (z / ez) ** 2 <= 1 + 1e-9;
  if (!inBound(x, z)) { const s = Math.sqrt((x / ex) ** 2 + (z / ez) ** 2); x /= s; z /= s; }
  /* đẩy điểm ra khỏi hình tròn vật cản (nở thêm radius): tương đương trượt theo tiếp tuyến */
  for (const o of obstacles || []) {
    const R = o.r + radius, ox = x - o.x, oz = z - o.z, od = Math.hypot(ox, oz);
    if (od >= R) continue;
    if (od < 1e-9) { x = pos.x; z = pos.z; break; }
    x = o.x + ox / od * R; z = o.z + oz / od * R;
  }
  const blocked = (obstacles || []).some(o => {
    const dd = Math.hypot(x - o.x, z - o.z);
    return dd < o.r + radius - 1e-6 && dd < Math.hypot(pos.x - o.x, pos.z - o.z) - 1e-9;
  });
  if (blocked || !inBound(x, z) && (pos.x / ex) ** 2 + (pos.z / ez) ** 2 <= 1) { x = pos.x; z = pos.z; }
  const moved = Math.hypot(x - pos.x, z - pos.z);
  return { x, z, arrived: Math.hypot(target.x - x, target.z - z) <= .05 || moved < 1e-6 };
}

let _w3lib = null;
/* Nạp Three.js + GLTFLoader một lần (theo import map trong index.html) */
function w3Load() {
  if (!_w3lib) _w3lib = Promise.all([import('three'), import('three/addons/loaders/GLTFLoader.js')])
    .then(([THREE, G]) => ({ THREE, GLTFLoader: G.GLTFLoader }))
    .catch(e => { _w3lib = null; throw e; });
  return _w3lib;
}

function w3Supported() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/* Texture vẽ bằng canvas 2D (nhãn trên đầu, lấp lánh, bóng mờ, hạt tuyết) */
function _w3CanvasTex(THREE, size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function _w3Radial(THREE, stops) {
  return _w3CanvasTex(THREE, 64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach(([p, c]) => r.addColorStop(p, c)); g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
}

/* Ông già Noel chibi dựng bằng khối cơ bản, cao bằng người tuyết */
function w3Santa(THREE) {
  const g = new THREE.Group(), mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .8, flatShading: true });
  const red = mat(0xd62d2d), white = mat(0xffffff), black = mat(0x2a2a2a), skin = mat(0xffd2b0), gold = mat(0xf5c542);
  const add = (geo, m, x, y, z, s) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (s) o.scale.set(...s); g.add(o); return o; };
  add(new THREE.BoxGeometry(.15, .1, .22), black, -.12, .05, .02);
  add(new THREE.BoxGeometry(.15, .1, .22), black, .12, .05, .02);
  add(new THREE.CylinderGeometry(.27, .35, .5, 8), red, 0, .35, 0);
  add(new THREE.CylinderGeometry(.36, .36, .07, 8), white, 0, .12, 0);
  add(new THREE.CylinderGeometry(.315, .325, .08, 8), black, 0, .32, 0);
  add(new THREE.BoxGeometry(.1, .08, .04), gold, 0, .32, .32);
  for (const s of [-1, 1]) {
    const arm = add(new THREE.CylinderGeometry(.07, .08, .32, 6), red, s * .33, .42, 0);
    arm.rotation.z = s * .5;
    add(new THREE.SphereGeometry(.075, 6, 5), white, s * .41, .27, 0);
  }
  add(new THREE.SphereGeometry(.21, 10, 8), skin, 0, .78, 0);
  add(new THREE.SphereGeometry(.2, 8, 6), white, 0, .68, .07, [1, 1.05, .75]);
  add(new THREE.SphereGeometry(.045, 6, 5), mat(0xf28b82), 0, .79, .2);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(.025, 5, 4), black, s * .08, .85, .18);
  add(new THREE.CylinderGeometry(.22, .22, .07, 10), white, 0, .93, 0);
  const hat = add(new THREE.ConeGeometry(.2, .3, 8), red, 0, 1.1, -.02); hat.rotation.x = -.25;
  add(new THREE.SphereGeometry(.06, 6, 5), white, 0, 1.24, -.07);
  const b = new THREE.Box3().setFromObject(g), h = b.max.y - b.min.y;
  g.scale.setScalar(W3_SNOW_H / h);
  return g;
}

/* Tạo thế giới trên canvas. opts: {bound:{rx,rz}, base:'models/holiday/'} */
async function w3Create(canvas, opts) {
  const { THREE, GLTFLoader } = await w3Load();
  const bound = opts.bound, base = opts.base || '';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(), sky = new THREE.Color(0xa9d2f2);
  scene.background = sky; scene.fog = new THREE.Fog(sky, 24, 60);
  const camera = new THREE.PerspectiveCamera(W3_CAM.fov, 1, .1, 120);
  scene.add(new THREE.HemisphereLight(0xeef6ff, 0x8fa3c4, 2));
  const sun = new THREE.DirectionalLight(0xffeedd, 1.8); sun.position.set(6, 12, 8); scene.add(sun);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshLambertMaterial({ color: 0xf2f6fc }));
  ground.rotation.x = -Math.PI / 2; ground.scale.set(bound.rx + 10, bound.rz + 10, 1); scene.add(ground);

  /* tuyết rơi: 300 hạt trong khối quanh camera */
  const N = 300, snowPos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) snowPos.set([(Math.random() - .5) * 30, Math.random() * 12, (Math.random() - .5) * 30], i * 3);
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ size: .09, transparent: true, depthWrite: false,
    map: _w3Radial(THREE, [[0, 'rgba(255,255,255,1)'], [.5, 'rgba(255,255,255,.8)'], [1, 'rgba(255,255,255,0)']]) }));
  scene.add(snow);

  /* ngôi sao 4 cánh lấp lánh */
  const sparkTex = _w3CanvasTex(THREE, 64, (g, s) => {
    const h = s / 2, w = s / 12; g.translate(h, h); g.fillStyle = '#fff6b0';
    for (const a of [0, Math.PI / 2]) {
      g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, -h);
      g.quadraticCurveTo(0, 0, w, 0); g.quadraticCurveTo(0, 0, 0, h); g.quadraticCurveTo(0, 0, -w, 0); g.quadraticCurveTo(0, 0, 0, -h);
      g.fill(); g.restore();
    }
  });
  const blobTex = _w3Radial(THREE, [[0, 'rgba(40,60,90,.45)'], [.6, 'rgba(40,60,90,.25)'], [1, 'rgba(40,60,90,0)']]);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  const loader = new GLTFLoader(), cache = {}, shared = {}, obstacles = [], npcs = [], pickups = [], ticks = [];
  let player = null, walk = null, tapCb = null, pickCb = null, raf = 0, dead = false, last = 0, t = 0;

  /* mọi model trong kit dùng chung một material "colormap": gộp lại để tiết kiệm */
  function load(name) {
    if (!cache[name]) cache[name] = loader.loadAsync(`${base}${name}.glb`).then(gl => {
      gl.scene.traverse(o => {
        if (!o.isMesh) return;
        const key = o.material.name + ':' + !!o.material.map;
        if (!shared[key]) shared[key] = o.material;
        else if (shared[key] !== o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); o.material = shared[key]; }
      });
      return gl.scene;
    });
    return cache[name];
  }
  function place(o, { x = 0, z = 0, rotY = 0, scale = 1 }) {
    o.position.set(x, 0, z); o.rotation.y = rotY; o.scale.setScalar(scale); scene.add(o); return o;
  }
  const solidAt = (x, z, r) => { if (r > 0) obstacles.push({ x, z, r }); };
  function hitbox(root, r, h, kind, id) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), hitMat);
    m.position.y = h / 2; m.userData.hit = { kind, id }; root.add(m); return m;
  }
  function heightOf(o) { const b = new THREE.Box3().setFromObject(o); return b.isEmpty() ? 1 : b.max.y - o.position.y; }

  const world = {
    THREE, scene, camera, renderer, obstacles,
    async model(name, o = {}) {
      const obj = place((await load(name)).clone(true), o);
      solidAt(o.x || 0, o.z || 0, o.solid || 0); return obj;
    },
    /* cây, đá lặp lại: InstancedMesh cho mỗi mesh trong model */
    async instances(name, list) {
      const src = await load(name), grp = new THREE.Group(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      src.updateMatrixWorld(true);
      src.traverse(mesh => {
        if (!mesh.isMesh) return;
        const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, list.length);
        list.forEach((it, i) => {
          m4.compose(new THREE.Vector3(it.x, 0, it.z), q.setFromAxisAngle(up, it.rotY || 0), new THREE.Vector3().setScalar(it.scale || 1));
          im.setMatrixAt(i, m4.multiply(mesh.matrixWorld));
        });
        im.computeBoundingSphere(); grp.add(im);
      });
      list.forEach(it => solidAt(it.x, it.z, it.solid || 0));
      scene.add(grp); return grp;
    },
    group(obj, { x = 0, z = 0, solid = 0, rotY = 0 } = {}) { place(obj, { x, z, rotY, scale: obj.scale.x }); solidAt(x, z, solid); return obj; },
    npc(id, obj, { x = 0, z = 0, r = .5, rotY = 0 } = {}) {
      const root = new THREE.Group(); root.position.set(x, 0, z); obj.position.set(0, 0, 0); obj.rotation.y = rotY; root.add(obj); scene.add(root);
      const h = heightOf(obj); hitbox(root, r + .25, h + .3, 'npc', id); solidAt(x, z, r);
      let mark = null;
      const n = { id, x, z, root, obj, rotY, h, phase: Math.random() * 6, blink: false,
        setMark(text) {
          if (mark) { root.remove(mark); mark.material.map.dispose(); mark.material.dispose(); mark = null; }
          if (!text) return;
          const tex = _w3CanvasTex(THREE, 128, (g, s) => {
            g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 4, 0, 7); g.fill();
            g.font = `${s * .6}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
            g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, s / 2, s / 2 + s * .04);
          });
          mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
          mark.scale.setScalar(.55); mark.position.y = h + .45; mark.renderOrder = 10; root.add(mark);
          n.blink = text === '❗' || text === '!';
        },
        get mark() { return mark; }
      };
      npcs.push(n); return n;
    },
    pickup(id, obj, { x = 0, z = 0 } = {}) {
      const root = new THREE.Group(); root.position.set(x, 0, z); obj.position.set(0, 0, 0); root.add(obj); scene.add(root);
      const h = heightOf(obj); hitbox(root, .6, Math.max(h, .6) + .4, 'pickup', id);
      const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      spark.position.set(.15, h * .8 + .1, .15); root.add(spark);
      const p = { id, x, z, root, obj, spark, h, phase: Math.random() * 6,
        remove() {
          const i = pickups.indexOf(p); if (i < 0) return;
          pickups.splice(i, 1); scene.remove(root); spark.material.dispose();
          root.traverse(o => { if (o.userData.hit) o.geometry.dispose(); });
        } };
      pickups.push(p); return p;
    },
    /* búp bê giấy: mặt phẳng có ảnh cutout, quay về phía camera */
    player(src, { x = 0, z = 0 } = {}) {
      const H = W3_SNOW_H * 1.6, W = H * 484 / 900;
      const geo = new THREE.PlaneGeometry(W, H); geo.translate(0, H / 2, 0);
      const tex = new THREE.TextureLoader().load(src); tex.colorSpace = THREE.SRGBColorSpace;
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .5, side: THREE.DoubleSide }));
      mesh.rotation.order = 'YXZ';   // quay theo camera rồi ngả ra sau một nửa góc nhìn cho đỡ bẹt
      const blob = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
      blob.rotation.x = -Math.PI / 2; blob.position.y = .015; blob.scale.set(1, .6, 1);
      const root = new THREE.Group(); root.position.set(x, 0, z); root.add(blob, mesh); scene.add(root);
      player = { x, z, root, mesh, face: 1,
        setSrc(s) { new THREE.TextureLoader().load(s, nt => { nt.colorSpace = THREE.SRGBColorSpace; const old = mesh.material.map; mesh.material.map = nt; mesh.material.needsUpdate = true; old.dispose(); }); } };
      snapCamera(); return player;
    },
    onTap(cb) { tapCb = cb; },
    onPickup(cb) { pickCb = cb; },
    onFrame(cb) { ticks.push(cb); },
    /* đi tới (x,z), dừng khi cách đích ≤ stopDist; onArrive(tới nơi thật hay bị kẹt) */
    walkTo(x, z, stopDist = 0, onArrive) { walk = { x, z, stopDist, onArrive }; },
    dispose
  };

  /* camera: nhìn chéo xuống ~50°, đi theo bé bằng lerp; màn dọc thì lùi xa hơn cho thấy đủ */
  const look = new THREE.Vector3(), goal = new THREE.Vector3();
  function placeCamera(k) {
    goal.set(player ? player.x : 0, .6, player ? player.z : 0);
    look.lerp(goal, k);
    const d = W3_CAM.dist * Math.max(1, Math.min(1.35, .8 / camera.aspect));
    camera.position.set(look.x, look.y + d * Math.sin(W3_CAM.tilt), look.z + d * Math.cos(W3_CAM.tilt));
    camera.lookAt(look);
  }
  const snapCamera = () => placeCamera(1);

  function resize() {
    const w = canvas.clientWidth || canvas.width || 1, h = canvas.clientHeight || canvas.height || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);
  resize(); snapCamera();

  /* chạm: ưu tiên npc/đồ vật (hitbox vô hình), không trúng thì lấy điểm trên mặt đất */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();
  let down = null;
  const onDown = e => { down = { x: e.clientX, y: e.clientY }; };
  const onUp = e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 14) { down = null; return; }
    down = null;
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets = npcs.concat(pickups).map(o => o.root.children.find(c => c.userData.hit));
    const hit = ray.intersectObjects(targets, false)[0];
    let ev = null;
    if (hit) {
      const info = hit.object.userData.hit, o = (info.kind === 'npc' ? npcs : pickups).find(v => v.id === info.id);
      ev = { kind: info.kind, id: info.id, x: o.x, z: o.z };
    } else if (ray.ray.intersectPlane(plane, hitP)) ev = { kind: 'ground', x: hitP.x, z: hitP.z };
    if (ev && tapCb) tapCb(ev);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now; t += dt;
    step(dt);
    renderer.render(scene, camera);
  }
  function step(dt) {
    let moving = false;
    if (player && walk) {
      const w = walk, r = w3Move(player, w, W3_SPEED * dt, obstacles, bound, W3_RADIUS);
      const ddx = r.x - player.x;
      if (Math.abs(ddx) > 1e-4) player.face = ddx > 0 ? 1 : -1;
      moving = Math.hypot(ddx, r.z - player.z) > 1e-5;
      player.x = r.x; player.z = r.z;
      const dist = Math.hypot(w.x - r.x, w.z - r.z);
      if (dist <= w.stopDist || r.arrived) {
        walk = null; moving = false;
        if (w.onArrive) w.onArrive(dist <= w.stopDist + .05);
      }
      if (pickCb) for (const p of pickups.slice()) if (!p.fired && Math.hypot(p.x - player.x, p.z - player.z) < .9) { p.fired = true; pickCb(p.id); }
    }
    if (player) {
      player.root.position.set(player.x, moving ? Math.abs(Math.sin(t * 12)) * .09 : 0, player.z);
      player.mesh.scale.x += (player.face - player.mesh.scale.x) * Math.min(1, dt * 14);
      player.mesh.rotation.y = Math.atan2(camera.position.x - player.x, camera.position.z - player.z);
      player.mesh.rotation.x = -W3_CAM.tilt * .5;
      player.root.children[0].position.y = .015 - player.root.position.y;
    }
    for (const n of npcs) {
      n.obj.position.y = Math.abs(Math.sin(t * 2.4 + n.phase)) * .04;
      let goal = n.rotY;
      if (player && Math.hypot(player.x - n.x, player.z - n.z) < 4) goal = Math.atan2(player.x - n.x, player.z - n.z);
      let dr = goal - n.obj.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      n.obj.rotation.y += dr * Math.min(1, dt * 5);
      if (n.mark) {
        n.mark.position.y = n.h + .45 + Math.sin(t * 3 + n.phase) * .06;
        n.mark.material.opacity = n.blink ? .55 + .45 * Math.abs(Math.cos(t * 3)) : 1;
      }
    }
    for (const p of pickups) {
      p.obj.rotation.y += dt * 1.5; p.obj.position.y = .12 + Math.sin(t * 2.5 + p.phase) * .08;
      const s = .3 + .3 * Math.abs(Math.sin(t * 4 + p.phase)); p.spark.scale.setScalar(s); p.spark.material.rotation = t * 2;
    }
    const a = snowGeo.attributes.position;
    for (let i = 0; i < N; i++) {
      let y = a.array[i * 3 + 1] - dt * (.8 + (i % 5) * .15);
      a.array[i * 3] += Math.sin(t + i) * dt * .2;
      a.array[i * 3 + 1] = y < 0 ? 12 : y;
    }
    a.needsUpdate = true; snow.position.set(look.x, 0, look.z);
    placeCamera(Math.min(1, dt * 4));
    for (const f of ticks) f(dt, t);
  }

  /* tạm dừng khi tab ẩn */
  const onVis = () => {
    if (dead) return;
    cancelAnimationFrame(raf); raf = 0;
    if (!document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', onVis);
  if (!document.hidden) raf = requestAnimationFrame(frame);

  function dispose() {
    if (dead) return; dead = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVis);
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp);
    if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
    const geos = new Set(), mats = new Set(), texs = new Set();
    const eat = o => {
      if (o.geometry) geos.add(o.geometry);
      [].concat(o.material || []).forEach(m => { mats.add(m); for (const k in m) if (m[k] && m[k].isTexture) texs.add(m[k]); });
    };
    scene.traverse(eat);
    Object.values(shared).forEach(m => eat({ material: m }));
    [sparkTex, blobTex].forEach(x => texs.add(x));
    geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texs.forEach(x => x.dispose());
    scene.clear(); renderer.dispose(); renderer.forceContextLoss();
    npcs.length = pickups.length = obstacles.length = ticks.length = 0; walk = player = tapCb = pickCb = null;
  }
  return world;
}
