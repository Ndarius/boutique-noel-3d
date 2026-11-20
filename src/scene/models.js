import * as THREE from 'three';
import { rng, stripes, pattern, plateTop, woodPlanks } from './textures.js';

// ---------------------------------------------------------------------------
// Modèles 3D procéduraux des produits (générés en code, aucun fichier externe)
// ---------------------------------------------------------------------------

const mats = new Map();
export function std(color, rough = 0.6, metal = 0, extra = {}) {
  const key = `${color}|${rough}|${metal}|${JSON.stringify(extra)}`;
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }));
  }
  return mats.get(key);
}
const phys = (opts) => new THREE.MeshPhysicalMaterial(opts);
export const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });

const GOLD = () => std('#d6a640', 0.25, 1, { emissive: '#3a2600', emissiveIntensity: 0.4 });
const PINE = () => std('#1f5a3d', 0.85, 0, { flatShading: true });
const WOOD = () => std('#7a4e2d', 0.75);
const SNOW = () => std('#f6f8fc', 0.9);
const SKIN = () => std('#f0cfb0', 0.7);
const BLACK = () => std('#151515', 0.5);

export const flames = []; // animées (vacillement) dans la boucle de rendu

const put = (parent, child) => (parent.add(child), child);

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function flame(x = 0, y = 0, z = 0, s = 1) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.SphereGeometry(0.035 * s, 12, 10), glow(5, 2.4, 0.6));
  outer.scale.set(1, 2, 1);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.018 * s, 8, 8), glow(6, 5, 3.5));
  core.scale.set(1, 1.6, 1);
  core.position.y = -0.015 * s;
  g.add(outer, core);
  g.position.set(x, y, z);
  g.userData.phase = Math.random() * 10;
  flames.push(g);
  return g;
}

function candle(r, h, color, x = 0, z = 0) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r, h, 24), std(color, 0.55), 0, h / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6), BLACK(), 0, h + 0.02, 0));
  g.add(flame(0, h + 0.07, 0, r > 0.07 ? 1.2 : 0.9));
  g.position.set(x, 0, z);
  return g;
}

function bow(color, s = 1) {
  const g = new THREE.Group();
  const m = std(color, 0.45, 0, { side: THREE.DoubleSide });
  const loopGeo = new THREE.TorusGeometry(0.09 * s, 0.025 * s, 8, 24);
  const l = mesh(loopGeo, m, -0.08 * s, 0, 0);
  l.scale.set(1, 0.6, 1);
  l.rotation.z = 0.3;
  const r = mesh(loopGeo, m, 0.08 * s, 0, 0);
  r.scale.set(1, 0.6, 1);
  r.rotation.z = -0.3;
  const knot = mesh(new THREE.SphereGeometry(0.035 * s, 12, 10), m);
  g.add(l, r, knot);
  for (const sx of [-1, 1]) {
    const tail = mesh(new THREE.BoxGeometry(0.04 * s, 0.18 * s, 0.012 * s), m, sx * 0.04 * s, -0.1 * s, 0);
    tail.rotation.z = sx * 0.35;
    g.add(tail);
  }
  return g;
}

// Instanciation d'éléments répétés (aiguilles, baies, ampoules...)
function instanced(geo, mat, transforms, colors) {
  const im = new THREE.InstancedMesh(geo, mat, transforms.length);
  const o = new THREE.Object3D();
  transforms.forEach((t, i) => {
    o.position.copy(t.p);
    o.rotation.set(t.r?.x || 0, t.r?.y || 0, t.r?.z || 0);
    o.scale.setScalar(t.s || 1);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
    if (colors) im.setColorAt(i, colors[i % colors.length]);
  });
  im.castShadow = true;
  return im;
}

// ---------------------------------------------------------------- Sapins
export function tree({ snow = false, ornaments = true, mini = false, seed = 4, height = 1 } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  let base = 0.2;
  if (mini) {
    g.add(mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.3, 24), std('#b89464', 0.95), 0, 0.15, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.04, 24), std('#8a2a2a', 0.8), 0, 0.25, 0));
    base = 0.42;
  }
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 10), WOOD(), 0, base - 0.05, 0));
  const tiers = 4;
  const ornT = [];
  for (let i = 0; i < tiers; i++) {
    const rad = 0.62 - i * 0.13;
    const h = 0.62 - i * 0.05;
    const y = base + i * 0.3 + h / 2;
    const cone = mesh(new THREE.ConeGeometry(rad, h, 14, 1), PINE(), 0, y, 0);
    cone.rotation.y = i * 0.7;
    g.add(cone);
    if (snow) {
      const hs = h * 0.5;
      const cap = mesh(new THREE.ConeGeometry(rad * 0.53, hs, 14, 1), SNOW(), 0, y + h / 2 - hs / 2 + 0.005, 0);
      cap.rotation.y = i * 0.7;
      g.add(cap);
      // rebord enneigé
      const rim = mesh(new THREE.TorusGeometry(rad * 0.93, 0.03, 6, 20), SNOW(), 0, y - h / 2 + 0.03, 0);
      rim.rotation.x = Math.PI / 2;
      g.add(rim);
    }
    if (ornaments) {
      const n = 7 - i;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + i * 1.3 + r() * 0.4;
        const f = 0.12 + r() * 0.35;
        const rr = rad * (1 - f) + 0.02;
        ornT.push({ p: new THREE.Vector3(Math.cos(a) * rr, y - h / 2 + f * h, Math.sin(a) * rr) });
      }
    }
  }
  if (ornaments) {
    const cols = ['#c8102e', '#e1b04a', '#f4f1ea', '#c8102e', '#2c62b8'].map((c) => new THREE.Color(c));
    g.add(instanced(new THREE.SphereGeometry(0.045, 12, 10), std('#ffffff', 0.2, 0.5), ornT, cols));
  }
  const topY = base + (tiers - 1) * 0.3 + (0.62 - (tiers - 1) * 0.05);
  const st = star({ size: 0.13 });
  st.position.y = topY + 0.08;
  g.add(st);
  g.scale.setScalar(height);
  return g;
}

// ---------------------------------------------------------------- Étoile
export function star({ size = 0.5, topper = false, depth } = {}) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 + Math.PI / 2;
    const rad = i % 2 ? size * 0.42 : size;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: depth ?? size * 0.18,
    bevelEnabled: true,
    bevelThickness: size * 0.06,
    bevelSize: size * 0.05,
    bevelSegments: 2,
  });
  geo.center();
  const m = mesh(geo, std('#e7b84e', 0.22, 1, { emissive: '#ffb21e', emissiveIntensity: topper ? 0.25 : 0.9 }));
  g.add(m);
  if (topper) {
    m.position.y = 0.55;
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.4, 12), GOLD(), 0, 0.2, 0));
    g.add(mesh(new THREE.SphereGeometry(0.06, 16, 12), GOLD(), 0, 0.06 + 0.32, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 24), std('#3a1d22', 0.8), 0, 0.025, 0));
  }
  return g;
}

// ---------------------------------------------------------------- Couronnes
export function wreath({ advent = false, bow: withBow = true, centerpiece = false, seed = 9 } = {}) {
  const g = new THREE.Group();
  const ring = new THREE.Group();
  const r = rng(seed);
  const R = centerpiece ? 0.36 : 0.42;
  ring.add(mesh(new THREE.TorusGeometry(R, 0.12, 10, 40), std('#173f2c', 0.9, 0, { flatShading: true })));
  const leaves = [];
  for (let i = 0; i < 130; i++) {
    const a = r() * Math.PI * 2;
    const b = r() * Math.PI * 2;
    const rr = R + Math.cos(b) * 0.12;
    leaves.push({
      p: new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(b) * 0.12),
      r: { x: r() * 6, y: r() * 6, z: r() * 6 },
      s: 0.8 + r() * 0.6,
    });
  }
  const greens = ['#1f5a3d', '#2c6e4b', '#16452f', '#3b7d55'].map((c) => new THREE.Color(c));
  ring.add(instanced(new THREE.ConeGeometry(0.05, 0.17, 4), std('#ffffff', 0.85, 0, { flatShading: true }), leaves, greens));
  const berries = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.2;
    berries.push({ p: new THREE.Vector3(Math.cos(a) * (R + 0.06), Math.sin(a) * (R + 0.06), 0.1 + r() * 0.04) });
  }
  ring.add(instanced(new THREE.SphereGeometry(0.03, 10, 8), std('#c0141f', 0.3, 0.1), berries));
  if (centerpiece) {
    const golds = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      golds.push({ p: new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0.12) });
    }
    ring.add(instanced(new THREE.SphereGeometry(0.06, 16, 12), std('#d9a63a', 0.2, 1), golds));
  }
  if (advent || centerpiece) {
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    g.add(ring);
    if (advent) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        g.add(candle(0.055, 0.28, '#a3182a', Math.cos(a) * R, Math.sin(a) * R));
      }
    } else {
      g.add(candle(0.07, 0.42, '#f4ead6', 0, 0));
      g.add(candle(0.06, 0.3, '#f4ead6', -0.13, 0.08));
      g.add(candle(0.06, 0.34, '#f4ead6', 0.13, 0.06));
    }
  } else {
    ring.position.y = R + 0.13;
    g.add(ring);
    if (withBow) {
      const b = bow('#a8101c', 1.5);
      b.position.set(0, 0.17, 0.14);
      g.add(b);
    }
  }
  return g;
}

// ---------------------------------------------------------------- Guirlande
export function garland({ seed = 5 } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const x = -0.75 + (i / 12) * 1.5;
    pts.push(new THREE.Vector3(x, 0.6 * (x / 0.75) ** 2 + 0.08, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  g.add(mesh(new THREE.TubeGeometry(curve, 64, 0.05, 8), std('#173f2c', 0.9)));
  const needles = [];
  for (let i = 0; i < 260; i++) {
    const p = curve.getPoint(r()).add(new THREE.Vector3((r() - 0.5) * 0.08, (r() - 0.5) * 0.12, (r() - 0.5) * 0.12));
    needles.push({ p, r: { x: r() * 6, y: r() * 6, z: r() * 6 }, s: 0.7 + r() * 0.6 });
  }
  const greens = ['#1f5a3d', '#2c6e4b', '#16452f', '#3b7d55'].map((c) => new THREE.Color(c));
  g.add(instanced(new THREE.ConeGeometry(0.035, 0.16, 4), std('#ffffff', 0.85, 0, { flatShading: true }), needles, greens));
  for (const t of [0.18, 0.38, 0.62, 0.82]) {
    const p = curve.getPoint(t);
    const cone = mesh(new THREE.ConeGeometry(0.06, 0.15, 9, 3), std('#6b4123', 0.95, 0, { flatShading: true }), p.x, p.y - 0.08, 0.06);
    cone.rotation.x = Math.PI;
    g.add(cone);
  }
  const berries = [];
  for (let i = 0; i < 14; i++) {
    berries.push({ p: curve.getPoint(r()).add(new THREE.Vector3(0, 0.02, 0.08)) });
  }
  g.add(instanced(new THREE.SphereGeometry(0.028, 10, 8), std('#c0141f', 0.3), berries));
  for (const x of [-0.75, 0.75]) {
    const b = bow('#a8101c', 0.8);
    b.position.set(x, 0.7, 0.05);
    g.add(b);
  }
  return g;
}

// ---------------------------------------------------------------- Boules
function baubleMesh({ color = '#b3121f', metal = 0.6, rough = 0.15, stripes: striped = false, r = 0.3 } = {}) {
  const g = new THREE.Group();
  const mat = striped
    ? phys({ map: stripes('#c8102e', '#fbf7f0', [6, 1]), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 })
    : phys({ color, metalness: metal, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.08 });
  g.add(mesh(new THREE.SphereGeometry(r, 48, 32), mat, 0, r, 0));
  g.add(mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.25, r * 0.25, 20), GOLD(), 0, r * 2 + r * 0.05, 0));
  const ring = mesh(new THREE.TorusGeometry(r * 0.12, r * 0.025, 8, 20), GOLD(), 0, r * 2 + r * 0.28, 0);
  g.add(ring);
  return g;
}

function stand(r = 0.16) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 1.15, 0.05, 32), std('#3a1d22', 0.85), 0, 0.025, 0));
  put(g, mesh(new THREE.TorusGeometry(r * 0.75, 0.012, 8, 32), GOLD(), 0, 0.055, 0)).rotation.x = Math.PI / 2;
  return g;
}

export function bauble(opts = {}) {
  const g = new THREE.Group();
  g.add(stand());
  const b = baubleMesh(opts);
  b.position.y = 0.0;
  g.add(b);
  return g;
}

export function baubleSet({ colors = ['#b3121f', '#d4232f', '#8f0f19'] } = {}) {
  const g = new THREE.Group();
  const tray = mesh(new THREE.BoxGeometry(1.25, 0.14, 0.48), std('#c9a679', 0.9), 0, 0.07, 0);
  g.add(tray);
  g.add(mesh(new THREE.BoxGeometry(1.27, 0.03, 0.5), std('#8f0f19', 0.7), 0, 0.13, 0));
  colors.forEach((c, i) => {
    const b = baubleMesh({ color: c, metal: i === 1 ? 0.1 : 0.7, rough: i === 1 ? 0.45 : 0.12, r: 0.19 });
    b.position.set((i - 1) * 0.4, 0.06, 0);
    g.add(b);
  });
  return g;
}

// ---------------------------------------------------------------- Flocon
export function snowflake() {
  const g = new THREE.Group();
  const flake = new THREE.Group();
  const m = phys({ color: '#dff2ff', metalness: 0.15, roughness: 0.12, clearcoat: 1, emissive: '#5aa9ff', emissiveIntensity: 0.35 });
  for (let k = 0; k < 3; k++) {
    const arm = mesh(new THREE.BoxGeometry(0.05, 0.9, 0.035), m);
    arm.rotation.z = (k * Math.PI) / 3;
    flake.add(arm);
  }
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    for (const d of [0.22, 0.34]) {
      for (const s of [-1, 1]) {
        const len = d === 0.22 ? 0.16 : 0.1;
        const br = mesh(new THREE.BoxGeometry(0.03, len, 0.03), m);
        const cx = -Math.sin(a) * d;
        const cy = Math.cos(a) * d;
        br.position.set(cx + -Math.sin(a + s * 0.8) * len * 0.5, cy + Math.cos(a + s * 0.8) * len * 0.5, 0);
        br.rotation.z = a + s * 0.8;
        flake.add(br);
      }
    }
  }
  const hex = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 6), m);
  hex.rotation.x = Math.PI / 2;
  flake.add(hex);
  flake.position.y = 0.62;
  g.add(flake);
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), GOLD(), 0, 0.1, 0));
  g.add(stand(0.12));
  return g;
}

// ---------------------------------------------------------------- Sucre d'orge
function cane(tex) {
  const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.6, 0)];
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    pts.push(new THREE.Vector3(0.15 - 0.15 * Math.cos(a), 0.6 + 0.15 * Math.sin(a), 0));
  }
  pts.push(new THREE.Vector3(0.3, 0.5, 0));
  const curve = new THREE.CatmullRomCurve3(pts);
  return mesh(new THREE.TubeGeometry(curve, 80, 0.035, 12), phys({ map: tex, roughness: 0.2, clearcoat: 1 }));
}

export function candyCane() {
  const g = new THREE.Group();
  const tex = stripes('#c8102e', '#fbf7f0', [14, 1]);
  const tex2 = stripes('#2f7a4c', '#fbf7f0', [14, 1]);
  g.add(mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.22, 24), std('#e9e3d7', 0.4), 0, 0.11, 0));
  put(g, mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 32), std('#c8102e', 0.5), 0, 0.17, 0)).rotation.x = Math.PI / 2;
  [[-0.05, 0.25, -0.15], [0.05, -0.4, 0.12], [0.0, 2.6, 0.02]].forEach(([x, ry, rz], i) => {
    const c = cane(i === 1 ? tex2 : tex);
    c.position.set(x, 0.1, 0);
    c.rotation.set(0, ry, rz);
    g.add(c);
  });
  return g;
}

// ---------------------------------------------------------------- Lumières
const BULB_WARM = new THREE.Color(3.2, 2.0, 0.9);
const BULB_MULTI = [
  new THREE.Color(3.4, 0.4, 0.4),
  new THREE.Color(0.4, 2.8, 0.7),
  new THREE.Color(0.5, 1.0, 3.6),
  new THREE.Color(3.4, 2.4, 0.4),
  new THREE.Color(2.8, 0.6, 2.8),
];

export function bulbs(points, multicolor = false, size = 0.035, intensity = 1) {
  const im = instanced(
    new THREE.SphereGeometry(size, 10, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity) }),
    points.map((p) => ({ p })),
    multicolor ? BULB_MULTI : [BULB_WARM],
  );
  im.castShadow = false;
  return im;
}

export function stringLights({ multicolor = false } = {}) {
  const g = new THREE.Group();
  const spoolM = std('#a77b4f', 0.8);
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 32), spoolM, 0, 0.025, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 32), spoolM, 0, 0.66, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 24), std('#d9c3a0', 0.9), 0, 0.34, 0));
  const pts = [];
  const turns = 6;
  for (let i = 0; i <= 240; i++) {
    const t = i / 240;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.235, 0.08 + t * 0.52, Math.sin(a) * 0.235));
  }
  // brin libre qui pend devant
  const end = pts[pts.length - 1];
  for (let i = 1; i <= 20; i++) {
    const t = i / 20;
    pts.push(new THREE.Vector3(end.x + t * 0.25, end.y - Math.sin(t * Math.PI) * 0.2 - t * 0.45, end.z + 0.18 + t * 0.05));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  g.add(mesh(new THREE.TubeGeometry(curve, 400, 0.008, 5), std(multicolor ? '#1e3b26' : '#b8743c', 0.4, multicolor ? 0 : 0.8)));
  const bp = [];
  for (let i = 0; i < 70; i++) bp.push(curve.getPoint(i / 69));
  g.add(bulbs(bp, multicolor, 0.03, 0.55));
  return g;
}

export function lantern() {
  const g = new THREE.Group();
  const frame = std('#f1ece2', 0.5);
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), frame, 0, 0.03, 0));
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), frame, 0, 0.66, 0));
  for (const x of [-0.19, 0.19])
    for (const z of [-0.19, 0.19]) g.add(mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), frame, x, 0.34, z));
  const roof = mesh(new THREE.ConeGeometry(0.33, 0.22, 4), frame, 0, 0.8, 0);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 24), BLACK(), 0, 0.97, 0));
  const glass = new THREE.MeshStandardMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.14, roughness: 0.05, depthWrite: false });
  put(g, new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.58, 0.36), glass)).position.y = 0.35;
  g.add(candle(0.065, 0.22, '#f4ead6').translateY(0.06));
  return g;
}

export function candles() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.04, 40), GOLD(), 0, 0.02, 0));
  g.add(candle(0.12, 0.5, '#f4ead6', -0.22, -0.06).translateY(0.04));
  g.add(candle(0.11, 0.36, '#9e1b24', 0.08, 0.12).translateY(0.04));
  g.add(candle(0.1, 0.27, '#2f5f45', 0.27, -0.12).translateY(0.04));
  for (const [x, z, ry] of [[-0.05, 0.3, 0.3], [0.38, 0.18, 1.2], [-0.38, 0.2, -0.8]]) {
    const leaf = mesh(new THREE.SphereGeometry(0.07, 10, 8), std('#1f6b46', 0.5), x, 0.06, z);
    leaf.scale.set(1.6, 0.25, 0.6);
    leaf.rotation.y = ry;
    g.add(leaf);
    g.add(mesh(new THREE.SphereGeometry(0.025, 8, 8), std('#c0141f', 0.3), x + 0.04, 0.08, z + 0.03));
  }
  return g;
}

export function lightStar() {
  const g = new THREE.Group();
  const R = 0.5;
  const verts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 + Math.PI / 2;
    const rad = i % 2 ? R * 0.42 : R;
    verts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad + 0.7, 0));
  }
  const path = new THREE.CurvePath();
  const bp = [];
  for (let i = 0; i < 10; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % 10];
    path.add(new THREE.LineCurve3(a, b));
    for (let k = 0; k < 4; k++) bp.push(a.clone().lerp(b, k / 4));
  }
  g.add(mesh(new THREE.TubeGeometry(path, 200, 0.014, 6, true), std('#cfd3da', 0.3, 1)));
  g.add(bulbs(bp, false, 0.028));
  g.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8), std('#cfd3da', 0.3, 1), 0, 0.25, 0));
  g.add(stand(0.13));
  return g;
}

export function photophore() {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#e8f3ff', transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
  });
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.5, 40, 1, true), glass)).position.y = 0.29;
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 40), glass, 0, 0.02, 0));
  g.add(candle(0.09, 0.2, '#f4ead6').translateY(0.04));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * 1.6 - 0.8;
    const leaf = mesh(new THREE.SphereGeometry(0.06, 10, 8), std('#1f6b46', 0.45), Math.sin(a) * 0.28, 0.05, Math.cos(a) * 0.28);
    leaf.scale.set(1.8, 0.3, 0.6);
    leaf.rotation.y = a;
    g.add(leaf);
  }
  for (const [x, z] of [[0.02, 0.32], [-0.06, 0.3], [0.08, 0.29]])
    g.add(mesh(new THREE.SphereGeometry(0.025, 8, 8), std('#c0141f', 0.3), x, 0.08, z));
  return g;
}

// ---------------------------------------------------------------- Figurines
function figure({ robe = '#3a5ba0', h = 0.32, r = 0.09, head = SKIN(), hair = null } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.ConeGeometry(r, h, 18), std(robe, 0.8), 0, h / 2, 0));
  g.add(mesh(new THREE.SphereGeometry(r * 0.58, 16, 12), head, 0, h + r * 0.35, 0));
  if (hair) {
    const v = mesh(new THREE.SphereGeometry(r * 0.66, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), std(hair, 0.85), 0, h + r * 0.4, -0.008);
    g.add(v);
  }
  return g;
}

export function nativity() {
  const g = new THREE.Group();
  const wood = std('#8a5a33', 0.85);
  g.add(mesh(new THREE.BoxGeometry(1.25, 0.08, 0.65), std('#5b3a22', 0.9), 0, 0.04, 0));
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.02, 0.5), std('#d3b060', 1), 0, 0.09, 0.02));
  const back = mesh(new THREE.BoxGeometry(1.1, 0.72, 0.05), new THREE.MeshStandardMaterial({ map: woodPlanks('#7a4e2d', [2, 1]), roughness: 0.9 }), 0, 0.44, -0.28);
  g.add(back);
  for (const x of [-0.52, 0.52]) {
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), wood, x, 0.47, 0.25));
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), wood, x, 0.47, -0.25));
  }
  const th = 0.5;
  for (const s of [-1, 1]) {
    const slab = mesh(new THREE.BoxGeometry(0.72, 0.04, 0.72), std('#6b4123', 0.9), s * 0.3, 0.98, 0);
    slab.rotation.z = -s * th;
    g.add(slab);
  }
  const st = star({ size: 0.1 });
  st.position.set(0, 1.27, 0.32);
  g.add(st);
  const mary = figure({ robe: '#36579e', hair: '#4f78c4' });
  mary.position.set(-0.24, 0.1, 0.05);
  mary.rotation.y = 0.4;
  const joseph = figure({ robe: '#7a5230', h: 0.38, hair: '#5a3a20' });
  joseph.position.set(0.26, 0.1, 0.02);
  joseph.rotation.y = -0.4;
  const staff = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), wood, 0.36, 0.35, 0.08);
  g.add(mary, joseph, staff);
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.08, 0.13), wood, 0, 0.14, 0.12));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.03, 0.11), std('#e2c069', 1), 0, 0.19, 0.12));
  const baby = mesh(new THREE.CapsuleGeometry(0.03, 0.06, 6, 12), std('#f7f1e6', 0.7), 0, 0.22, 0.12);
  baby.rotation.z = Math.PI / 2;
  g.add(baby);
  return g;
}

export function santons() {
  const g = new THREE.Group();
  const rock = mesh(new THREE.DodecahedronGeometry(0.5, 1), std('#a89878', 0.95, 0, { flatShading: true }), 0, 0, 0);
  rock.scale.set(1.3, 0.18, 0.6);
  g.add(rock);
  const berger = figure({ robe: '#6e4a2c', h: 0.4, r: 0.1 });
  berger.position.set(-0.35, 0.06, 0);
  const brim = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), std('#3b2a1a', 0.9), 0, 0.47, 0);
  berger.add(brim, mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 16), std('#3b2a1a', 0.9), 0, 0.5, 0));
  berger.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.55, 6), WOOD(), 0.12, 0.27, 0.04));
  const lav = figure({ robe: '#4c6fb0', h: 0.36, r: 0.1, hair: '#f5f1e6' });
  lav.position.set(0, 0.06, 0.05);
  lav.add(mesh(new THREE.ConeGeometry(0.075, 0.2, 18, 1, true), std('#f5f1e6', 0.9, 0, { side: THREE.DoubleSide }), 0, 0.15, 0.03));
  const basket = mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.06, 16), std('#b48a4f', 0.95), 0.11, 0.2, 0.05);
  lav.add(basket);
  const meunier = figure({ robe: '#d9d2c3', h: 0.38, r: 0.1 });
  meunier.position.set(0.35, 0.06, 0);
  meunier.add(mesh(new THREE.ConeGeometry(0.05, 0.08, 16), std('#c8323c', 0.8), 0, 0.49, 0));
  const sack = mesh(new THREE.SphereGeometry(0.09, 14, 10), std('#e8dcc2', 0.95), -0.12, 0.33, -0.03);
  sack.scale.set(0.9, 1.2, 0.8);
  meunier.add(sack);
  g.add(berger, lav, meunier);
  return g;
}

export function snowman() {
  const g = new THREE.Group();
  const snow = std('#f7f9fc', 0.75, 0, { emissive: '#a9c4ff', emissiveIntensity: 0.05 });
  g.add(mesh(new THREE.SphereGeometry(0.3, 32, 24), snow, 0, 0.28, 0));
  g.add(mesh(new THREE.SphereGeometry(0.22, 32, 24), snow, 0, 0.7, 0));
  g.add(mesh(new THREE.SphereGeometry(0.16, 32, 24), snow, 0, 1.0, 0));
  for (const y of [0.62, 0.72, 0.82]) g.add(mesh(new THREE.SphereGeometry(0.022, 8, 8), BLACK(), 0, y, 0.215 - Math.abs(y - 0.7) * 0.15));
  for (const x of [-0.055, 0.055]) g.add(mesh(new THREE.SphereGeometry(0.02, 8, 8), BLACK(), x, 1.04, 0.14));
  const nose = mesh(new THREE.ConeGeometry(0.025, 0.14, 12), std('#ef7a1a', 0.6), 0, 0.99, 0.2);
  nose.rotation.x = Math.PI / 2;
  g.add(nose);
  const scarf = mesh(new THREE.TorusGeometry(0.15, 0.045, 10, 28), std('#b3121f', 0.95), 0, 0.86, 0);
  scarf.rotation.x = Math.PI / 2;
  g.add(scarf);
  const tail = mesh(new THREE.BoxGeometry(0.07, 0.22, 0.03), std('#b3121f', 0.95), 0.1, 0.74, 0.14);
  tail.rotation.z = 0.25;
  g.add(tail);
  g.add(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 28), BLACK(), 0, 1.13, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 28), BLACK(), 0, 1.24, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.122, 0.122, 0.04, 28), std('#b3121f', 0.6), 0, 1.17, 0));
  return g;
}

export function angel() {
  const g = new THREE.Group();
  const robe = phys({ color: '#fbf6ee', roughness: 0.4, sheen: 1, sheenColor: '#ffe9b0' });
  g.add(mesh(new THREE.ConeGeometry(0.22, 0.62, 28), robe, 0, 0.31, 0));
  put(g, mesh(new THREE.TorusGeometry(0.085, 0.015, 8, 24), GOLD(), 0, 0.42, 0)).rotation.x = Math.PI / 2;
  g.add(mesh(new THREE.SphereGeometry(0.1, 24, 16), SKIN(), 0, 0.7, 0));
  g.add(mesh(new THREE.SphereGeometry(0.108, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), std('#e3b860', 0.6), 0, 0.715, -0.012));
  const halo = mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 0.8) }), 0, 0.86, -0.02);
  halo.rotation.x = Math.PI / 2.4;
  g.add(halo);
  const ws = new THREE.Shape();
  ws.moveTo(0, 0);
  ws.bezierCurveTo(0.1, 0.25, 0.32, 0.38, 0.42, 0.3);
  ws.bezierCurveTo(0.36, 0.2, 0.34, 0.1, 0.26, 0.02);
  ws.bezierCurveTo(0.2, -0.06, 0.1, -0.08, 0, 0);
  const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
  for (const s of [-1, 1]) {
    const w = mesh(wg, robe, s * 0.03, 0.42, -0.08);
    w.scale.x = s;
    w.rotation.y = s * -0.5;
    g.add(w);
  }
  return g;
}

export function nutcracker() {
  const g = new THREE.Group();
  const red = std('#b3121f', 0.45, 0.05);
  g.add(mesh(new THREE.BoxGeometry(0.36, 0.07, 0.26), std('#1f4d36', 0.5), 0, 0.035, 0));
  g.add(mesh(new THREE.BoxGeometry(0.38, 0.015, 0.28), GOLD(), 0, 0.075, 0));
  for (const x of [-0.065, 0.065]) {
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16), std('#f3efe6', 0.5), x, 0.24, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.056, 0.06, 0.12, 16), BLACK(), x, 0.14, 0));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.32, 24), red, 0, 0.55, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.133, 0.133, 0.045, 24), BLACK(), 0, 0.43, 0));
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), GOLD(), 0, 0.43, 0.13));
  for (const y of [0.52, 0.58, 0.64]) g.add(mesh(new THREE.SphereGeometry(0.014, 8, 8), GOLD(), 0, y, 0.128));
  for (const s of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.3, 14), red, s * 0.165, 0.55, 0);
    arm.rotation.z = s * 0.1;
    g.add(arm);
    g.add(mesh(new THREE.SphereGeometry(0.04, 12, 10), std('#f3efe6', 0.5), s * 0.18, 0.39, 0));
    const ep = mesh(new THREE.SphereGeometry(0.055, 14, 10), GOLD(), s * 0.14, 0.7, 0);
    ep.scale.set(1, 0.4, 1);
    g.add(ep);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.095, 0.1, 0.18, 24), SKIN(), 0, 0.81, 0));
  const beard = mesh(new THREE.BoxGeometry(0.15, 0.09, 0.05), std('#fbfbf8', 0.95), 0, 0.75, 0.085);
  g.add(beard);
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.012, 0.01), BLACK(), 0, 0.77, 0.112));
  for (const x of [-0.035, 0.035]) g.add(mesh(new THREE.SphereGeometry(0.012, 8, 8), BLACK(), x, 0.85, 0.09));
  g.add(mesh(new THREE.SphereGeometry(0.02, 8, 8), std('#e0806a', 0.6), 0, 0.82, 0.1));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 24), BLACK(), 0, 1.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.103, 0.103, 0.03, 24), GOLD(), 0, 0.93, 0));
  g.add(mesh(new THREE.ConeGeometry(0.035, 0.12, 12), red, 0.04, 1.19, 0));
  return g;
}

export function santa() {
  const g = new THREE.Group();
  const red = std('#b01722', 0.85);
  const fur = std('#fbfbf8', 1);
  g.add(mesh(new THREE.ConeGeometry(0.27, 0.6, 28), red, 0, 0.3, 0));
  put(g, mesh(new THREE.TorusGeometry(0.245, 0.04, 10, 32), fur, 0, 0.03, 0)).rotation.x = Math.PI / 2;
  put(g, mesh(new THREE.TorusGeometry(0.16, 0.03, 10, 32), BLACK(), 0, 0.3, 0)).rotation.x = Math.PI / 2;
  g.add(mesh(new THREE.BoxGeometry(0.07, 0.06, 0.03), GOLD(), 0, 0.3, 0.17));
  put(g, mesh(new THREE.BoxGeometry(0.04, 0.4, 0.02), fur, 0, 0.2, 0.17)).rotation.x = -0.4;
  g.add(mesh(new THREE.SphereGeometry(0.13, 24, 16), SKIN(), 0, 0.7, 0));
  const beard = mesh(new THREE.SphereGeometry(0.13, 20, 14), fur, 0, 0.6, 0.06);
  beard.scale.set(1, 1.15, 0.7);
  g.add(beard);
  for (const s of [-1, 1]) {
    const mu = mesh(new THREE.SphereGeometry(0.04, 12, 10), fur, s * 0.045, 0.67, 0.12);
    mu.scale.set(1.4, 0.7, 0.8);
    g.add(mu);
    g.add(mesh(new THREE.SphereGeometry(0.013, 8, 8), BLACK(), s * 0.045, 0.74, 0.115));
  }
  g.add(mesh(new THREE.SphereGeometry(0.025, 10, 8), std('#e0706a', 0.5), 0, 0.7, 0.13));
  put(g, mesh(new THREE.TorusGeometry(0.12, 0.035, 10, 28), fur, 0, 0.79, 0)).rotation.x = Math.PI / 2;
  const hat = mesh(new THREE.ConeGeometry(0.12, 0.3, 20), red, 0.03, 0.93, -0.02);
  hat.rotation.z = -0.35;
  g.add(hat);
  g.add(mesh(new THREE.SphereGeometry(0.04, 12, 10), fur, 0.09, 1.06, -0.02));
  const sack = mesh(new THREE.SphereGeometry(0.16, 18, 14), std('#7a5a3a', 0.95), 0.27, 0.15, -0.1);
  sack.scale.set(0.9, 1.1, 0.9);
  g.add(sack);
  return g;
}

// ---------------------------------------------------------------- Cadeaux & table
export function gift(size = 0.5, color = '#b3121f', ribbon = '#e1b04a') {
  const g = new THREE.Group();
  const h = size * 0.8;
  g.add(mesh(new THREE.BoxGeometry(size, h, size), std(color, 0.6), 0, h / 2, 0));
  const rm = std(ribbon, 0.3, ribbon === '#e1b04a' ? 0.7 : 0.1);
  g.add(mesh(new THREE.BoxGeometry(size * 1.01, h * 1.01, size * 0.14), rm, 0, h / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(size * 0.14, h * 1.01, size * 1.01), rm, 0, h / 2, 0));
  const b = bow(ribbon, size * 1.6);
  b.position.y = h + size * 0.05;
  b.rotation.x = -0.4;
  g.add(b);
  return g;
}

export function giftStack() {
  const g = new THREE.Group();
  const a = gift(0.56, '#b3121f', '#e1b04a');
  const b = gift(0.4, '#1f5a3d', '#c8323c');
  b.position.y = 0.45;
  b.rotation.y = 0.45;
  const c = gift(0.26, '#f4efe4', '#c8102e');
  c.position.y = 0.77;
  c.rotation.y = -0.35;
  g.add(a, b, c);
  return g;
}

export function wrapRolls() {
  const g = new THREE.Group();
  const cap = std('#c9a679', 0.9);
  const specs = [
    ['stars', '#a3101c', '#e8c25a', -0.17, 0.09],
    ['stripes', '#1f5a3d', '#f6efe2', 0.17, 0.09],
    ['dots', '#1b2a52', '#f6efe2', 0, 0.245],
  ];
  for (const [kind, bg, fg, z, y] of specs) {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 32), [
      new THREE.MeshStandardMaterial({ map: pattern(kind, bg, fg), roughness: 0.5 }),
      cap,
      cap,
    ]);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, y, z);
    roll.castShadow = true;
    g.add(roll);
  }
  return g;
}

export function ribbons() {
  const g = new THREE.Group();
  const specs = [['#b3121f', 0.1], ['#d6a640', 0.8], ['#1f5a3d', 0.1]];
  specs.forEach(([c, metal], i) => {
    const spool = new THREE.Group();
    spool.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.11, 36), phys({ color: c, roughness: 0.3, metalness: metal, sheen: 1, sheenColor: '#ffffff' })));
    spool.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.115, 24), std('#e4d2b0', 0.9)));
    spool.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 20), std('#2a1d14', 1)));
    spool.rotation.x = Math.PI / 2;
    spool.position.set((i - 1) * 0.38, 0.17, 0);
    g.add(spool);
  });
  const tail = mesh(new THREE.BoxGeometry(0.38, 0.004, 0.08), phys({ color: '#d6a640', roughness: 0.3, metalness: 0.8 }), 0.12, 0.002, 0.12);
  tail.rotation.y = 0.3;
  g.add(tail);
  return g;
}

export function plate() {
  const g = new THREE.Group();
  const white = std('#fbf8f2', 0.25);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.36, 0.04, 64), [
    white,
    new THREE.MeshStandardMaterial({ map: plateTop(), roughness: 0.2 }),
    white,
  ]);
  p.castShadow = true;
  p.rotation.x = Math.PI / 2 - 0.28;
  p.position.set(0, 0.5, 0);
  g.add(p);
  const wood = WOOD();
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.05, 0.3), wood, 0, 0.025, 0));
  const back = mesh(new THREE.BoxGeometry(0.06, 0.6, 0.04), wood, 0, 0.32, -0.16);
  back.rotation.x = -0.28;
  g.add(back);
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.06, 0.04), wood, 0, 0.08, 0.1));
  return g;
}

export function centerpiece() {
  return wreath({ centerpiece: true });
}

export function stocking() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-0.15, 0.6);
  s.lineTo(-0.15, 0.1);
  s.quadraticCurveTo(-0.15, -0.08, 0.03, -0.08);
  s.lineTo(0.28, -0.08);
  s.quadraticCurveTo(0.42, -0.08, 0.42, 0.045);
  s.quadraticCurveTo(0.42, 0.17, 0.25, 0.17);
  s.lineTo(0.15, 0.17);
  s.lineTo(0.15, 0.6);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 4 });
  geo.translate(0, 0, -0.04);
  const sock = mesh(geo, std('#a3101c', 0.95), 0, 0.12, 0);
  g.add(sock);
  const cuff = mesh(new THREE.BoxGeometry(0.42, 0.16, 0.2), std('#fbfbf8', 1), 0, 0.76, 0);
  g.add(cuff);
  for (const [x, r] of [[-0.06, 0.6], [0.04, -0.6]]) {
    const leaf = mesh(new THREE.SphereGeometry(0.05, 10, 8), std('#1f6b46', 0.5), x, 0.78, 0.11);
    leaf.scale.set(1.5, 0.6, 0.3);
    leaf.rotation.z = r;
    g.add(leaf);
  }
  g.add(mesh(new THREE.SphereGeometry(0.025, 8, 8), std('#c0141f', 0.3), -0.01, 0.77, 0.13));
  g.add(mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 20), std('#e1b04a', 0.3, 0.8), -0.15, 0.9, 0));
  return g;
}

// ---------------------------------------------------------------- Registre
const FACTORIES = {
  tree, star, wreath, garland, bauble, baubleSet, snowflake, candyCane,
  stringLights, lantern, candles, lightStar, photophore,
  nativity, santons, snowman, angel, nutcracker, santa,
  giftStack, wrapRolls, ribbons, plate, centerpiece, stocking,
};

// Construit le modèle d'un produit et le normalise pour tenir sur une étagère.
export function buildProduct(product, { maxH = 0.68, maxW = 1.5, maxD = 0.8 } = {}) {
  const factory = FACTORIES[product.model];
  const inner = factory(product.opts || {});
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const s = Math.min(maxH / size.y, maxW / size.x, maxD / size.z);
  inner.scale.multiplyScalar(s);
  const box2 = new THREE.Box3().setFromObject(inner);
  const c = box2.getCenter(new THREE.Vector3());
  inner.position.sub(new THREE.Vector3(c.x, box2.min.y, c.z));
  const outer = new THREE.Group();
  outer.add(inner);
  outer.userData.size = box2.getSize(new THREE.Vector3());
  return outer;
}
