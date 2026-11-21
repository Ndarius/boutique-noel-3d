import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildProduct, tree, gift, star, bulbs, flames, std, wreath } from './models.js';
import { rng, snowGround, cobbles, woodPlanks, signTexture, softDot } from './textures.js';

const RING_RADIUS = 16;
const W = 7; // largeur d'un chalet
const D = 3.6; // profondeur
const H = 3.4; // hauteur des murs
const BASE = 0.25; // hauteur de l'estrade
const SHELVES = [1.0, 2.05];
const SLOTS_X = [-2.1, 0, 2.1];

// isMobile = appareil modeste (téléphone, tablette) → on allège le rendu.
// isNarrow() = écran étroit → mise en page et cadrages « téléphone ».
export const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
export const isNarrow = () => matchMedia('(max-width: 760px)').matches;
// Écran bas (téléphone couché) : on garde le menu à gauche mais en pleine hauteur
export const isShort = () => matchMedia('(min-width: 761px) and (max-height: 520px)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createWorld(container, rayons) {
  // ---------------------------------------------------------------- Rendu
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.25 : 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const horizon = new THREE.Color('#1a2747');
  scene.fog = new THREE.Fog(horizon, 38, 150);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(isNarrow() ? 62 : 50, container.clientWidth / container.clientHeight, 0.1, 400);
  camera.position.set(0, 34, 70);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.8;
  controls.target.set(0, 3, 0);
  controls.enabled = false;

  // ---------------------------------------------------------------- Lumières
  scene.add(new THREE.HemisphereLight('#9fb4ff', '#3a2a22', 0.55));
  const moon = new THREE.DirectionalLight('#c3d3ff', 1.1);
  moon.position.set(-28, 42, -18);
  moon.castShadow = true;
  moon.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 });
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.03;
  scene.add(moon);

  // ---------------------------------------------------------------- Ciel
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color('#040814') }, bottom: { value: horizon } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:
        'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6, 0., 1.); gl_FragColor = vec4(mix(bottom, top, pow(h, .6)), 1.); }',
    }),
  );
  scene.add(sky);

  const starCount = 1800;
  const starPos = new Float32Array(starCount * 3);
  const r0 = rng(21);
  for (let i = 0; i < starCount; i++) {
    const th = r0() * Math.PI * 2;
    const ph = Math.acos(0.15 + r0() * 0.85);
    starPos.set([Math.sin(ph) * Math.cos(th) * 260, Math.cos(ph) * 260, Math.sin(ph) * Math.sin(th) * 260], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: '#ffffff', size: 1.4, map: softDot(), transparent: true, depthWrite: false, fog: false }),
  );
  scene.add(stars);

  const moonDisk = new THREE.Mesh(new THREE.SphereGeometry(7, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.5), fog: false }));
  moonDisk.position.copy(moon.position).normalize().multiplyScalar(230);
  scene.add(moonDisk);

  // ---------------------------------------------------------------- Sol
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(160, 64),
    new THREE.MeshStandardMaterial({ color: '#e9eef6', map: snowGround(), roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(21, 64),
    new THREE.MeshStandardMaterial({ color: '#b9b6c2', map: cobbles(), roughness: 0.85 }),
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // Congères le long de la place
  const drifts = [];
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2;
    drifts.push({ a, r: 21.3 + r0() * 0.8, s: 0.8 + r0() * 1.4 });
  }
  const driftMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 10), std('#eef2f8', 0.95), drifts.length);
  const o = new THREE.Object3D();
  drifts.forEach((d, i) => {
    o.position.set(Math.cos(d.a) * d.r, 0, Math.sin(d.a) * d.r);
    o.scale.set(d.s * 1.8, d.s * 0.45, d.s);
    o.rotation.y = -d.a;
    o.updateMatrix();
    driftMesh.setMatrixAt(i, o.matrix);
  });
  driftMesh.receiveShadow = true;
  scene.add(driftMesh);

  // ---------------------------------------------------------------- Forêt
  buildForest(scene);

  // ---------------------------------------------------------------- Grand sapin
  const bigTree = buildBigTree();
  scene.add(bigTree.group);

  // ---------------------------------------------------------------- Chalets
  const chalets = [];
  const products = [];
  const hitboxes = [];
  rayons.forEach((rayon, i) => {
    const theta = THREE.MathUtils.degToRad(180 + i * 45); // de gauche (rayon 1) à droite (rayon 5)
    const pos = new THREE.Vector3(Math.cos(theta) * RING_RADIUS, 0, Math.sin(theta) * RING_RADIUS);
    const inward = pos.clone().multiplyScalar(-1).normalize();
    const c = buildChalet(rayon);
    c.group.position.copy(pos);
    c.group.rotation.y = Math.atan2(inward.x, inward.z);
    scene.add(c.group);
    c.group.updateMatrixWorld(true);

    const chalet = { rayon, group: c.group, pos, inward, index: i, hit: c.hit, signMat: c.signMat };
    c.hit.userData = { type: 'chalet', chalet };
    hitboxes.push(c.hit);
    chalets.push(chalet);

    rayon.products.forEach((product, k) => {
      const obj = buildProduct(product, { maxH: 0.88, maxW: 1.75, maxD: 0.85 });
      const shelf = k < 3 ? 1 : 0;
      const x = SLOTS_X[k % 3];
      obj.position.set(x, SHELVES[shelf] + 0.04, -D / 2 + 0.52);
      c.group.add(obj);
      const size = obj.userData.size;
      const hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(size.x, 0.9) + 0.2, 1.0, 1));
      hit.visible = false;
      hit.position.set(x, SHELVES[shelf] + 0.52, -D / 2 + 0.55);
      c.group.add(hit);
      const entry = { product, rayon, chalet, object: obj, hit, hover: 0, spin: 0 };
      hit.userData = { type: 'product', entry };
      hitboxes.push(hit);
      products.push(entry);
    });
    c.group.updateMatrixWorld(true);
    products.filter((p) => p.chalet === chalet).forEach((p) => {
      p.world = new THREE.Vector3();
      p.object.getWorldPosition(p.world);
    });

    // Guirlande lumineuse du sommet du sapin jusqu'au chalet
    const from = new THREE.Vector3(0, 10.2, 0);
    const to = pos.clone().add(inward.clone().multiplyScalar(D / 2 + 0.6)).setY(BASE + H + 1.2);
    const pts = [];
    for (let k = 1; k < 60; k++) {
      const t = k / 60;
      const p = from.clone().lerp(to, t);
      p.y -= Math.sin(t * Math.PI) * 1.6;
      pts.push(p);
    }
    scene.add(bulbs(pts, true, 0.07));
  });

  // Lampadaires entre les chalets
  [202.5, 247.5, 292.5, 337.5, 150, 30].forEach((deg, i) => {
    const th = THREE.MathUtils.degToRad(deg);
    const r = i >= 4 ? 19 : RING_RADIUS + 0.5;
    const lamp = buildLamp();
    lamp.position.set(Math.cos(th) * r, 0, Math.sin(th) * r);
    scene.add(lamp);
  });

  // ---------------------------------------------------------------- Neige qui tombe
  const snow = buildSnow(isMobile ? 1800 : 4200);
  scene.add(snow.points);

  // ---------------------------------------------------------------- Anneau de sélection
  const selRing = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.64, 64),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.1, 0.45), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  selRing.rotation.x = -Math.PI / 2;
  scene.add(selRing);

  // ---------------------------------------------------------------- Post-traitement
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.55, 0.5, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------------------------------------------------------------- Caméra : vols animés
  let flight = null;
  const cyl = (v) => ({ r: Math.hypot(v.x, v.z), a: Math.atan2(v.x, v.z), y: v.y });
  const fromCyl = (c) => new THREE.Vector3(Math.sin(c.a) * c.r, c.y, Math.cos(c.a) * c.r);
  const lerpAngle = (a, b, t) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  };

  function flyTo(pos, target, { duration = 1.8, mode = 'overview', azimuthRange = 0.7 } = {}) {
    const p0 = cyl(camera.position);
    const t0 = cyl(controls.target);
    const p1 = cyl(pos);
    const t1 = cyl(target);
    let da = Math.abs(lerpAngle(p0.a, p1.a, 1) - p0.a);
    const lift = Math.min(5, da * 3) * (p0.r < 12 && p1.r < 12 ? 1 : 0.3);
    controls.enabled = false;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    flight = {
      t: 0,
      duration: reducedMotion ? 0.01 : duration,
      step(k) {
        const e = ease(k);
        const pc = { r: THREE.MathUtils.lerp(p0.r, p1.r, e), a: lerpAngle(p0.a, p1.a, e), y: THREE.MathUtils.lerp(p0.y, p1.y, e) + Math.sin(e * Math.PI) * lift };
        const tc = { r: THREE.MathUtils.lerp(t0.r, t1.r, e), a: lerpAngle(t0.a, t1.a, e), y: THREE.MathUtils.lerp(t0.y, t1.y, e) };
        camera.position.copy(fromCyl(pc));
        controls.target.copy(fromCyl(tc));
        camera.lookAt(controls.target);
      },
      done() {
        camera.position.copy(pos);
        controls.target.copy(target);
        applyLimits(mode, azimuthRange);
        controls.enabled = true;
      },
    };
  }

  function applyLimits(mode, range) {
    if (mode === 'overview') {
      controls.minDistance = 12;
      controls.maxDistance = isNarrow() ? 110 : 60;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = 1.4;
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;
    } else {
      const off = camera.position.clone().sub(controls.target);
      const az = Math.atan2(off.x, off.z);
      controls.minAzimuthAngle = az - range;
      controls.maxAzimuthAngle = az + range;
      controls.minPolarAngle = 0.9;
      controls.maxPolarAngle = 1.75;
      controls.minDistance = mode === 'product' ? 1.2 : 4;
      controls.maxDistance = mode === 'product' ? 4 : 11;
    }
    controls.update();
  }

  // Sur ordinateur, on décale légèrement le cadrage pour laisser la place au panneau de gauche.
  // Recul nécessaire pour que `halfWidth` mètres tiennent dans la largeur de l'écran
  const fitDist = (halfWidth, base) => {
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    return Math.max(base, halfWidth / Math.tan(hfov / 2));
  };
  const views = {
    panelOpen: true, // le menu de gauche est-il déplié ? (décale le cadrage)
    get narrow() {
      return isNarrow();
    },
    overview() {
      return isNarrow()
        ? (() => {
            // recul calculé pour que les 5 chalets tiennent dans la largeur du téléphone
            const d = fitDist(19, 48);
            return { pos: new THREE.Vector3(0, 2 + d * 0.62, -4 + d * 0.78), target: new THREE.Vector3(0, -d * 0.2, -4) };
          })() // village cadré dans le haut de l'écran, au-dessus du volet
        : (() => {
            const k = Math.max(1, fitDist(24, 38) / 38);
            const x = views.panelOpen ? -4.5 * Math.min(1.5, Math.max(1, (Math.min(520, Math.max(360, innerWidth * 0.27)) / innerWidth) / 0.27)) : 0;
            return { pos: new THREE.Vector3(x, 16 * k, 33 * k), target: new THREE.Vector3(x, 1.5, -5) };
          })();
    },
    chalet(chalet) {
      const n = chalet.inward;
      const side = new THREE.Vector3(n.z, 0, -n.x);
      const shift = side.multiplyScalar(isNarrow() || !views.panelOpen ? 0 : -1.5);
      return {
        pos: chalet.pos.clone().add(n.clone().multiplyScalar(isNarrow() ? 11 : fitDist(4.6, 6.9))).setY(isNarrow() ? 3.6 : 2.5).add(shift),
        target: chalet.pos.clone().add(n.clone().multiplyScalar(0.3)).setY(isNarrow() ? -0.4 : 2.15).add(shift),
      };
    },
    product(entry) {
      const n = entry.chalet.inward;
      const p = entry.world.clone().add(new THREE.Vector3(0, 0.32, 0));
      return {
        pos: p.clone().add(n.clone().multiplyScalar(isNarrow() ? 4.6 : fitDist(1.3, 2.9))).add(new THREE.Vector3(0, isNarrow() ? 0.9 : 0.4, 0)),
        target: p.clone().add(new THREE.Vector3(0, isNarrow() ? -0.95 : 0, 0)),
      };
    },
  };

  // ---------------------------------------------------------------- Survol / sélection
  let selected = null;
  let hovered = null;
  function setSelected(entry) {
    selected = entry;
  }
  function setHovered(entry) {
    hovered = entry;
  }

  // ---------------------------------------------------------------- Boucle
  const perf = { samples: 0, total: 0, low: false };
  function lowQuality() {
    if (perf.low) return;
    perf.low = true;
    bloom.enabled = false;
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    moon.castShadow = false;
    scene.traverse((o) => o.material && (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)));
    snow.points.geometry.setDrawRange(0, 900);
    resize();
  }
  let introSpin = true;
  let director = null;
  const updaters = [];
  let elapsed = 0;
  let last = performance.now();
  function frame() {
    const now = performance.now();
    const realDt = Math.min((now - last) / 1000, 0.5);
    last = now;
    const dt = Math.min(realDt, 0.05);
    elapsed += dt;
    const t = elapsed;

    for (const u of updaters) u(dt, t, realDt);

    if (director) {
      director(realDt);
    } else if (flight) {
      // temps réel : le vol dure toujours la même durée, quelle que soit la fluidité
      flight.t += realDt / flight.duration;
      if (flight.t >= 1) {
        const f = flight;
        flight = null;
        f.done();
      } else flight.step(flight.t);
    } else if (introSpin) {
      const a = t * 0.05;
      camera.position.set(Math.sin(a) * 62, 30, Math.cos(a) * 62);
      camera.lookAt(0, 4, 0);
    } else {
      controls.update();
    }

    snow.update(dt, t);
    bigTree.update(t);
    stars.rotation.y = t * 0.003;

    for (const f of flames) {
      const s = 1 + Math.sin(t * 13 + f.userData.phase) * 0.08 + Math.sin(t * 7.3 + f.userData.phase * 2) * 0.06;
      f.scale.set(1, s, 1);
    }

    for (const p of products) {
      const target = p === hovered || p === selected ? 1 : 0;
      p.hover += (target - p.hover) * Math.min(1, dt * 8);
      p.object.scale.setScalar(1 + p.hover * 0.08);
      if (p === selected) p.spin += dt * 0.7;
      else p.spin *= 1 - Math.min(1, dt * 3);
      p.object.rotation.y = p.spin;
    }

    if (selected) {
      selRing.position.copy(selected.world).add(new THREE.Vector3(0, 0.015, 0));
      const sz = selected.object.userData.size;
      selRing.scale.setScalar(Math.max(0.7, Math.max(sz.x, sz.z) * 0.7));
      selRing.material.opacity = 0.4 + Math.sin(t * 3) * 0.2;
    } else selRing.material.opacity = Math.max(0, selRing.material.opacity - dt * 2);

    for (const c of chalets) {
      c.signMat.emissiveIntensity = (0.55 + (c.highlight ? 0.45 : 0) + Math.sin(t * 2 + c.index) * 0.03) * (c.illum ?? 1);
    }

    // Qualité adaptée à la machine : si l'ordinateur peine, on coupe les effets coûteux
    if (perf.samples < 120) {
      perf.samples++;
      perf.total += realDt;
      if (perf.samples === 120 && perf.total / 120 > 1 / 28) lowQuality();
    }
    if (bloom.enabled) composer.render();
    else renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.fov = isNarrow() ? 62 : 50;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  addEventListener('resize', resize);

  // ---------------------------------------------------------------- Allumage du village
  // Tout ce qui brille (ampoules, lanternes, flammes, lumières des chalets) est
  // recensé pour pouvoir « allumer » le village en vague depuis la cheminée.
  const glowing = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (o === moonDisk || o === selRing) return;
    const p = o.getWorldPosition(new THREE.Vector3());
    if (o.isLight && o.isPointLight) glowing.push({ light: o, base: o.intensity, p });
    else if ((o.isMesh || o.isSprite) && o.material && !Array.isArray(o.material) && (o.material.isMeshBasicMaterial || o.material.isSpriteMaterial)) {
      const c = o.material.color;
      if (Math.max(c.r, c.g, c.b) >= 0.99) glowing.push({ mat: o.material, base: c.clone(), p });
    }
  });
  function setIllumination(center, radius) {
    const f = (d) => THREE.MathUtils.clamp((radius - d) / 5, 0, 1);
    for (const g of glowing) {
      const k = f(g.p.distanceTo(center));
      if (g.light) g.light.intensity = g.base * k;
      else g.mat.color.copy(g.base).multiplyScalar(0.07 + 0.93 * k); // éteint = verre sombre, pas noir
    }
    for (const c of chalets) c.illum = f(c.pos.distanceTo(center));
  }

  // ---------------------------------------------------------------- Cheminée (chalet du fond)
  const chimneyChalet = chalets[2];
  const chimney = buildChimney();
  chimney.group.position.set(1.8, 0, -0.85);
  chimneyChalet.group.add(chimney.group);
  chimneyChalet.group.updateMatrixWorld(true);
  const chimneyTop = chimney.top.clone().applyMatrix4(chimney.group.matrixWorld);
  updaters.push((dt, t) => chimney.update(dt, t));

  // Précompile les shaders pour éviter les à-coups au premier affichage
  renderer.compileAsync?.(scene, camera).catch(() => {});

  // Si le téléphone coupe la 3D (mémoire saturée), on prévient l'interface.
  let onLost = null;
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    onLost?.();
  });

  frame();

  return {
    onContextLost: (fn) => (onLost = fn),
    setIllumination,
    refreshSigns() {
      for (const c of chalets) {
        const tex = signTexture({ number: c.rayon.number, title: c.rayon.name, accent: c.rayon.accent });
        c.signMat.map = tex;
        c.signMat.emissiveMap = tex;
        c.signMat.needsUpdate = true;
      }
    },
    chimneyTop,
    addUpdater: (fn) => updaters.push(fn),
    setDirector(fn) {
      director = fn;
      introSpin = false;
      controls.enabled = !fn;
    },
    releaseCamera(target) {
      director = null;
      controls.target.copy(target);
      applyLimits('overview');
      controls.enabled = true;
    },
    renderer,
    scene,
    camera,
    controls,
    chalets,
    products,
    hitboxes,
    views,
    flyTo,
    setSelected,
    setHovered,
    stopIntro() {
      introSpin = false;
    },
    get flying() {
      return !!flight;
    },
  };
}

// ======================================================================
function buildChalet(rayon) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ map: woodPlanks('#7a4a2a', [4, 1]), roughness: 0.85 });
  const sideMat = new THREE.MeshStandardMaterial({ map: woodPlanks('#7a4a2a', [2, 1]), roughness: 0.85 });
  const dark = std('#4a2c19', 0.8);
  const accent = std(rayon.accent, 0.55);
  const snowM = std('#f3f6fb', 0.9);

  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  add(new THREE.BoxGeometry(W + 0.6, BASE, D + 1.2), new THREE.MeshStandardMaterial({ map: woodPlanks('#5a3a24', [6, 2]), roughness: 0.9 }), 0, BASE / 2, 0.3);
  add(new THREE.BoxGeometry(W, H, 0.2), wallMat, 0, BASE + H / 2, -D / 2);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.2, H, D), sideMat, (s * W) / 2, BASE + H / 2, 0);
  // Poteaux d'angle et bandeau
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.3, H, 0.3), dark, (s * W) / 2, BASE + H / 2, D / 2);
  add(new THREE.BoxGeometry(W + 0.3, 0.5, 0.3), dark, 0, BASE + H - 0.25, D / 2);
  add(new THREE.BoxGeometry(W + 0.32, 0.09, 0.32), accent, 0, BASE + H - 0.5, D / 2);

  // Meuble bas + étagère haute
  add(new THREE.BoxGeometry(W - 0.6, SHELVES[0] - BASE, 0.95), new THREE.MeshStandardMaterial({ map: woodPlanks('#8b5a33', [4, 1]), roughness: 0.8 }), 0, BASE + (SHELVES[0] - BASE) / 2, -D / 2 + 0.55);
  add(new THREE.BoxGeometry(W - 0.5, 0.05, 1.0), dark, 0, SHELVES[0] + 0.02, -D / 2 + 0.55);
  add(new THREE.BoxGeometry(W - 0.5, 0.06, 0.88), dark, 0, SHELVES[1], -D / 2 + 0.5);
  add(new THREE.BoxGeometry(W - 0.5, 0.05, 0.03), accent, 0, SHELVES[1] - 0.005, -D / 2 + 0.95);
  add(new THREE.BoxGeometry(W - 0.5, 0.06, 0.03), accent, 0, SHELVES[0] - 0.02, -D / 2 + 1.06);
  for (const x of [-3, 0, 3]) add(new THREE.BoxGeometry(0.06, 0.25, 0.6), dark, x, SHELVES[1] - 0.15, -D / 2 + 0.36);

  // Toit à deux pans
  const rh = 1.5;
  const hd = D / 2 + 0.6;
  const ang = Math.atan2(rh, hd);
  const slope = Math.hypot(rh, hd);
  const top = BASE + H;
  const roofMat = std('#3b2216', 0.85);
  for (const s of [-1, 1]) {
    const slab = add(new THREE.BoxGeometry(W + 1.0, 0.14, slope + 0.1), roofMat, 0, top + rh / 2, (s * hd) / 2);
    slab.rotation.x = s * ang;
    const sn = add(new THREE.BoxGeometry(W + 1.08, 0.16, slope + 0.16), snowM, 0, top + rh / 2 + Math.cos(ang) * 0.14, (s * hd) / 2 + s * Math.sin(ang) * 0.14);
    sn.rotation.x = s * ang;
  }
  const gable = new THREE.Shape();
  const ze = rh * (1 - D / 2 / hd);
  gable.moveTo(-D / 2, 0);
  gable.lineTo(D / 2, 0);
  gable.lineTo(D / 2, ze);
  gable.lineTo(0, rh);
  gable.lineTo(-D / 2, ze);
  gable.closePath();
  const gGeo = new THREE.ExtrudeGeometry(gable, { depth: 0.2, bevelEnabled: false });
  for (const s of [-1, 1]) {
    const m = add(gGeo, sideMat, s * (W / 2) - 0.1, top, 0);
    m.rotation.y = Math.PI / 2;
  }

  // Enseigne
  const signTex = signTexture({ number: rayon.number, title: rayon.name, accent: rayon.accent });
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.6, roughness: 0.6 });
  const sign = add(new THREE.BoxGeometry(4.8, 0.94, 0.1), [dark, dark, dark, dark, signMat, dark], 0, top + 0.9, hd - 0.15);
  sign.rotation.x = -0.08;
  add(new THREE.BoxGeometry(5.0, 0.06, 0.14), std('#d6a640', 0.3, 1), 0, top + 0.42, hd - 0.12);

  // Guirlande lumineuse sous l'avant-toit
  const pts = [];
  const span = W + 0.8;
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const x = -span / 2 + t * span;
    const sag = Math.abs(Math.sin(t * Math.PI * 3)) * 0.28;
    pts.push(new THREE.Vector3(x, top - 0.05 - sag, hd + 0.02));
  }
  g.add(bulbs(pts, false, 0.045));

  // Lumière intérieure chaude
  const lamp = new THREE.PointLight('#ffc27a', 16, 8.5, 1.4);
  lamp.position.set(0, BASE + H - 0.45, 0.2);
  g.add(lamp);

  // Petits sapins de chaque côté + couronnes
  for (const s of [-1, 1]) {
    const t = tree({ snow: true, ornaments: true, seed: 3 + s + rayon.number, height: 1.25 });
    t.position.set(s * (W / 2 + 1.1), 0, D / 2 + 0.2);
    g.add(t);
    const w = wreath({ bow: true, seed: rayon.number * 3 + s });
    w.scale.setScalar(0.55);
    w.position.set(s * (W / 2 + 0.11), 1.6, 0.4);
    w.rotation.y = s * Math.PI / 2;
    g.add(w);
  }

  // Zone cliquable du chalet
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, H + 2, D + 1.4));
  hit.position.set(0, (H + 2) / 2, 0.2);
  hit.visible = false;
  g.add(hit);

  return { group: g, hit, signMat };
}

function buildLamp() {
  const g = new THREE.Group();
  const iron = std('#1d2129', 0.45, 0.7);
  const add = (geo, mat, y) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y;
    m.castShadow = true;
    g.add(m);
    return m;
  };
  add(new THREE.CylinderGeometry(0.22, 0.3, 0.4, 12), iron, 0.2);
  add(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 12), iron, 2.2);
  add(new THREE.CylinderGeometry(0.28, 0.18, 0.12, 8), iron, 4.0);
  add(new THREE.CylinderGeometry(0.22, 0.2, 0.55, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 1.0) }), 4.33);
  add(new THREE.ConeGeometry(0.36, 0.35, 8), iron, 4.78);
  add(new THREE.SphereGeometry(0.06, 8, 8), iron, 5.0);
  // ruban rouge
  const bowM = std('#b3121f', 0.6);
  const b = add(new THREE.TorusGeometry(0.12, 0.03, 8, 16), bowM, 3.6);
  b.rotation.y = Math.PI / 2;
  return g;
}

function buildForest(scene) {
  const r = rng(77);
  const n = isMobile ? 140 : 260;
  const coneGeo = new THREE.ConeGeometry(1, 1, 9, 1);
  coneGeo.translate(0, 0.5, 0);
  const capGeo = new THREE.ConeGeometry(1, 1, 9, 1);
  capGeo.translate(0, 0.5, 0);
  const trees = new THREE.InstancedMesh(coneGeo, std('#173a2b', 0.9, 0, { flatShading: true }), n * 3);
  const caps = new THREE.InstancedMesh(capGeo, std('#eef2f8', 0.9, 0, { flatShading: true }), n * 3);
  const o = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const rad = 30 + r() ** 0.8 * 55;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    // laisse une allée dégagée devant l'entrée
    if (z > 20 && Math.abs(x) < 9) continue;
    const h = 5 + r() * 7;
    const w = h * (0.32 + r() * 0.08);
    for (let t = 0; t < 3; t++) {
      const th = h * (0.55 - t * 0.12);
      const tw = w * (1 - t * 0.25);
      const ty = h * 0.12 + t * h * 0.24;
      o.position.set(x, ty, z);
      o.rotation.set(0, r() * 6, 0);
      o.scale.set(tw, th, tw);
      o.updateMatrix();
      trees.setMatrixAt(k, o.matrix);
      o.position.y = ty + th * 0.55;
      o.scale.set(tw * 0.46, th * 0.45, tw * 0.46);
      o.updateMatrix();
      caps.setMatrixAt(k, o.matrix);
      k++;
    }
  }
  trees.count = caps.count = k;
  trees.castShadow = true;
  scene.add(trees, caps);

  // Montagnes à l'horizon
  const mGeo = new THREE.ConeGeometry(1, 1, 6, 1);
  mGeo.translate(0, 0.5, 0);
  const mountains = new THREE.InstancedMesh(mGeo, std('#3a4a6e', 1, 0, { flatShading: true }), 18);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + r() * 0.2;
    const rad = 120 + r() * 30;
    o.position.set(Math.cos(a) * rad, -2, Math.sin(a) * rad);
    const h = 25 + r() * 30;
    o.scale.set(h * 1.4, h, h * 1.4);
    o.rotation.set(0, r() * 6, 0);
    o.updateMatrix();
    mountains.setMatrixAt(i, o.matrix);
  }
  scene.add(mountains);
}

function buildBigTree() {
  const group = new THREE.Group();
  const r = rng(99);
  const pine = std('#1c5238', 0.85, 0, { flatShading: true });
  const snowM = std('#f1f5fb', 0.9, 0, { flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.4, 12), std('#5b3a22', 0.9));
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  group.add(trunk);
  const orn = [];
  for (let i = 0; i < 7; i++) {
    const rad = 4.3 - i * 0.56;
    const h = 3.0 - i * 0.2;
    const y = 0.9 + i * 1.33 + h / 2;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 20, 1), pine);
    cone.position.y = y;
    cone.rotation.y = i * 0.6;
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.4, h * 0.4, 20, 1), snowM);
    cap.position.y = y + h / 2 - h * 0.2 + 0.01;
    cap.rotation.y = i * 0.6;
    group.add(cap);
    const n = 26 - i * 3;
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2;
      const f = 0.06 + r() * 0.5;
      const rr = rad * (1 - f) + 0.12;
      orn.push({ p: new THREE.Vector3(Math.cos(a) * rr, y - h / 2 + f * h, Math.sin(a) * rr), s: 0.8 + r() * 0.6 });
    }
  }
  const cols = ['#c8102e', '#e1b04a', '#e1b04a', '#f4f1ea', '#c8102e', '#2c62b8'].map((c) => new THREE.Color(c));
  const ornMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.7, roughness: 0.15, clearcoat: 1 }), orn.length);
  const o = new THREE.Object3D();
  orn.forEach((e, i) => {
    o.position.copy(e.p);
    o.scale.setScalar(e.s);
    o.updateMatrix();
    ornMesh.setMatrixAt(i, o.matrix);
    ornMesh.setColorAt(i, cols[i % cols.length]);
  });
  ornMesh.castShadow = true;
  group.add(ornMesh);

  // Spirale de lumières
  const lightPts = [];
  const count = isMobile ? 260 : 420;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const y = 1.3 + t * 9.0;
    const rad = 4.35 * (1 - (y - 0.9) / 10.3) + 0.35 + Math.sin(t * 160) * 0.1;
    const a = t * Math.PI * 2 * 11;
    lightPts.push(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad));
  }
  const lights = bulbs(lightPts, false, 0.075, 0.55);
  group.add(lights);

  const topStar = star({ size: 0.75 });
  topStar.position.y = 11.1;
  group.add(topStar);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: new THREE.Color(2.5, 1.8, 0.7), transparent: true, depthWrite: false, opacity: 0.3 }));
  halo.scale.setScalar(3.2);
  halo.position.y = 11.1;
  group.add(halo);
  const starLight = new THREE.PointLight('#ffcf7a', 30, 18, 1.6);
  starLight.position.y = 9;
  group.add(starLight);
  const baseLight = new THREE.PointLight('#ffb067', 22, 11, 1.5);
  baseLight.position.set(0, 2.2, 5);
  group.add(baseLight);

  // Cadeaux au pied du sapin
  const giftCols = [['#b3121f', '#e1b04a'], ['#1f5a3d', '#f4efe4'], ['#f4efe4', '#c8102e'], ['#2c4a8a', '#e1b04a'], ['#d46a9a', '#f4efe4'], ['#e1b04a', '#b3121f']];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * 0.2;
    const rad = 4.3 + r() * 1.4;
    const [c, rb] = giftCols[i % giftCols.length];
    const gft = gift(0.6 + r() * 0.6, c, rb);
    gft.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad);
    gft.rotation.y = r() * 6;
    group.add(gft);
  }
  // Tapis de neige autour du tronc
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.3, 40), std('#f3f6fb', 0.95));
  skirt.position.y = 0.15;
  skirt.receiveShadow = true;
  group.add(skirt);

  const baseColors = lights.instanceColor.array.slice();
  return {
    group,
    update(t) {
      // scintillement doux
      const arr = lights.instanceColor.array;
      for (let i = 0; i < count; i++) {
        const k = 0.7 + 0.3 * Math.sin(t * 2.2 + i * 1.7);
        arr[i * 3] = baseColors[i * 3] * k;
        arr[i * 3 + 1] = baseColors[i * 3 + 1] * k;
        arr[i * 3 + 2] = baseColors[i * 3 + 2] * k;
      }
      lights.instanceColor.needsUpdate = true;
      topStar.rotation.y = t * 0.6;
      halo.material.opacity = 0.28 + Math.sin(t * 1.5) * 0.08;
    },
  };
}

function buildSnow(count) {
  const pos = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  const phase = new Float32Array(count);
  const r = rng(5);
  const S = 70;
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (r() - 0.5) * S;
    pos[i * 3 + 1] = r() * 26;
    pos[i * 3 + 2] = (r() - 0.5) * S;
    speed[i] = 0.6 + r() * 0.9;
    phase[i] = r() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: '#ffffff', size: 0.14, map: softDot(), transparent: true, depthWrite: false, opacity: 0.95 }),
  );
  points.frustumCulled = false;
  return {
    points,
    update(dt, t) {
      const k = reducedMotion ? 0.25 : 1;
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        pos[j + 1] -= speed[i] * dt * k;
        pos[j] += Math.sin(t * 0.6 + phase[i]) * 0.25 * dt * k;
        pos[j + 2] += Math.cos(t * 0.4 + phase[i]) * 0.15 * dt * k;
        if (pos[j + 1] < 0) {
          pos[j + 1] = 26;
          pos[j] = (r() - 0.5) * S;
          pos[j + 2] = (r() - 0.5) * S;
        }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// Cheminée en briques avec fumée qui s'élève
function buildChimney() {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#5a2a20';
  x.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 8; row++) {
    for (let col = -1; col < 4; col++) {
      const v = 120 + Math.floor(Math.random() * 40);
      x.fillStyle = `rgb(${v},${Math.floor(v * 0.42)},${Math.floor(v * 0.32)})`;
      x.fillRect(col * 36 + (row % 2) * 18 + 2, row * 16 + 2, 32, 12);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  const brick = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 0.8), brick);
  body.position.y = 4.95;
  body.castShadow = true;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 1.0), std('#4a2018', 0.9));
  cap.position.y = 6.0;
  const snow = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.14, 1.06), std('#f3f6fb', 0.9));
  snow.position.y = 6.14;
  const hole = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.02, 0.56), new THREE.MeshBasicMaterial({ color: '#120806' }));
  hole.position.y = 6.22;
  g.add(body, cap, snow, hole);

  const n = 40;
  const pos = new Float32Array(n * 3);
  const life = new Float32Array(n).map(() => Math.random());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const smoke = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#aeb8cc', size: 0.9, map: softDot(), transparent: true, opacity: 0.32, depthWrite: false }));
  smoke.frustumCulled = false;
  g.add(smoke);
  return {
    group: g,
    top: new THREE.Vector3(0, 6.25, 0),
    update(dt, t) {
      for (let i = 0; i < n; i++) {
        life[i] += dt * 0.18;
        if (life[i] > 1) life[i] -= 1;
        const k = life[i];
        pos[i * 3] = Math.sin(k * 5 + i) * 0.25 + k * 1.2;
        pos[i * 3 + 1] = 6.3 + k * 4.5;
        pos[i * 3 + 2] = Math.cos(k * 4 + i) * 0.25 - k * 0.6;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
