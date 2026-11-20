import * as THREE from 'three';
import { santa, gift, glow, std } from './models.js';
import { softDot } from './textures.js';

// ============================================================================
// Séquence d'ouverture en 3D temps réel :
// le village dort → le traîneau surgit du ciel → il se pose au-dessus de la
// cheminée → un cadeau tombe → le village s'illumine en vague → il repart vers la lune.
// ============================================================================

const red = () => new THREE.MeshPhysicalMaterial({ color: '#a3101c', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
const gold = () => std('#d9a63a', 0.22, 1, { emissive: '#3a2600', emissiveIntensity: 0.5 });

function m(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}

// ---------------------------------------------------------------- Renne
function reindeer(lead = false) {
  const g = new THREE.Group();
  const fur = std('#7a4e30', 0.85);
  const furLight = std('#c9a27c', 0.9);
  const dark = std('#2a1a10', 0.6);
  const body = m(new THREE.CapsuleGeometry(0.24, 0.75, 8, 16), fur, 0, 0.95, 0);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const belly = m(new THREE.CapsuleGeometry(0.17, 0.6, 6, 12), furLight, 0, 0.86, 0.02);
  belly.rotation.x = Math.PI / 2;
  g.add(belly);
  const neck = m(new THREE.CylinderGeometry(0.11, 0.16, 0.6, 12), fur, 0, 1.25, 0.5);
  neck.rotation.x = 0.7;
  g.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 1.52, 0.72);
  const skull = m(new THREE.SphereGeometry(0.15, 16, 12), fur);
  skull.scale.set(0.9, 0.9, 1.3);
  const snout = m(new THREE.SphereGeometry(0.1, 14, 10), furLight, 0, -0.05, 0.17);
  snout.scale.set(0.9, 0.8, 1.2);
  head.add(skull, snout);
  for (const s of [-1, 1]) {
    head.add(m(new THREE.SphereGeometry(0.022, 8, 8), dark, s * 0.08, 0.04, 0.12));
    const ear = m(new THREE.ConeGeometry(0.05, 0.16, 8), fur, s * 0.13, 0.08, -0.04);
    ear.rotation.z = -s * 1.1;
    head.add(ear);
    // bois en ramure
    const pts = [
      new THREE.Vector3(s * 0.06, 0.1, -0.05),
      new THREE.Vector3(s * 0.14, 0.32, -0.12),
      new THREE.Vector3(s * 0.24, 0.5, -0.2),
      new THREE.Vector3(s * 0.32, 0.62, -0.14),
    ];
    const antlerMat = std('#e1cfa8', 0.6);
    head.add(m(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.022, 6), antlerMat));
    for (const [a, b] of [[1, [s * 0.04, 0.42, 0.02]], [2, [s * 0.38, 0.5, -0.32]]]) {
      const from = pts[a];
      const to = from.clone().add(new THREE.Vector3(...b).multiplyScalar(0.5));
      head.add(m(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from, from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.03, 0)), to]), 8, 0.016, 6), antlerMat));
    }
  }
  if (lead) {
    const nose = m(new THREE.SphereGeometry(0.045, 12, 10), glow(5, 0.5, 0.4), 0, -0.04, 0.3);
    head.add(nose);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: new THREE.Color(2.5, 0.3, 0.2), transparent: true, depthWrite: false, opacity: 0.8 }));
    halo.scale.setScalar(0.5);
    halo.position.set(0, -0.04, 0.32);
    head.add(halo);
  } else head.add(m(new THREE.SphereGeometry(0.04, 10, 8), dark, 0, -0.04, 0.3));
  g.add(head);
  // queue
  g.add(m(new THREE.SphereGeometry(0.07, 8, 8), std('#f3ece0', 1), 0, 1.05, -0.55));
  // harnais rouge + grelots dorés
  const strap = m(new THREE.TorusGeometry(0.25, 0.035, 8, 24), std('#b3121f', 0.5), 0, 0.95, 0.2);
  g.add(strap);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i - 2) * 0.5;
    g.add(m(new THREE.SphereGeometry(0.04, 10, 8), gold(), Math.sin(a) * 0.27, 0.95 + Math.cos(a) * 0.27, 0.2));
  }
  // pattes articulées
  const legs = [];
  for (const [x, z, ph] of [[-0.13, 0.32, 0], [0.13, 0.32, Math.PI], [-0.13, -0.32, Math.PI * 0.6], [0.13, -0.32, Math.PI * 1.6]]) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.85, z);
    const upper = m(new THREE.CylinderGeometry(0.06, 0.045, 0.42, 8), fur, 0, -0.21, 0);
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    const lower = m(new THREE.CylinderGeometry(0.04, 0.03, 0.38, 8), fur, 0, -0.19, 0);
    const hoof = m(new THREE.CylinderGeometry(0.045, 0.05, 0.07, 8), dark, 0, -0.4, 0);
    knee.add(lower, hoof);
    hip.add(upper, knee);
    g.add(hip);
    legs.push({ hip, knee, ph });
  }
  g.userData.animate = (t) => {
    for (const l of legs) {
      const a = Math.sin(t * 9 + l.ph);
      l.hip.rotation.x = a * 0.75;
      l.knee.rotation.x = Math.max(0, -Math.cos(t * 9 + l.ph)) * 1.1;
    }
    head.rotation.x = Math.sin(t * 9) * 0.06;
    g.position.y = Math.sin(t * 9) * 0.05;
  };
  return g;
}

// ---------------------------------------------------------------- Traîneau
export function buildSleigh() {
  const root = new THREE.Group();
  const sleigh = new THREE.Group();
  root.add(sleigh);

  // caisse : profil latéral extrudé (avant = +z)
  const s = new THREE.Shape();
  s.moveTo(-0.95, 0);
  s.lineTo(-1.0, 0.8);
  s.quadraticCurveTo(-0.98, 1.0, -0.78, 0.95);
  s.lineTo(-0.55, 0.5);
  s.lineTo(0.45, 0.5);
  s.quadraticCurveTo(0.85, 0.55, 1.0, 0.95);
  s.quadraticCurveTo(1.12, 1.12, 0.92, 1.08);
  s.quadraticCurveTo(0.85, 0.5, 0.6, 0);
  s.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 16 });
  bodyGeo.translate(0, 0, -0.45);
  bodyGeo.rotateY(-Math.PI / 2);
  const body = m(bodyGeo, red(), 0, 0.3, 0);
  sleigh.add(body);
  // intérieur en velours + liserés dorés
  sleigh.add(m(new THREE.BoxGeometry(0.82, 0.12, 1.2), std('#4a0d16', 1), 0, 0.82, -0.1));
  for (const x of [-0.5, 0.5]) {
    const swirl = m(new THREE.TorusGeometry(0.16, 0.025, 8, 24, Math.PI * 1.6), gold(), x, 0.62, 0.1);
    swirl.rotation.y = Math.PI / 2;
    sleigh.add(swirl);
    const rail = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 1.1, -0.98), new THREE.Vector3(x, 0.82, -0.55), new THREE.Vector3(x, 0.82, 0.45), new THREE.Vector3(x, 1.25, 1.0),
    ]);
    sleigh.add(m(new THREE.TubeGeometry(rail, 40, 0.025, 6), gold()));
    // patins
    const runner = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x * 0.95, 0.02, -1.15), new THREE.Vector3(x * 0.95, 0, 0), new THREE.Vector3(x * 0.95, 0.02, 0.95),
      new THREE.Vector3(x * 0.95, 0.2, 1.35), new THREE.Vector3(x * 0.95, 0.45, 1.3), new THREE.Vector3(x * 0.95, 0.42, 1.12),
    ]);
    sleigh.add(m(new THREE.TubeGeometry(runner, 60, 0.04, 8), gold()));
    for (const z of [-0.7, 0.1, 0.7]) sleigh.add(m(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), gold(), x * 0.95, 0.18, z));
  }
  // Père Noël assis
  const pere = santa();
  pere.scale.setScalar(1.25);
  pere.position.set(0, 0.62, 0.1);
  sleigh.add(pere);
  // hotte pleine de cadeaux
  const sack = m(new THREE.SphereGeometry(0.42, 20, 16), std('#7a5230', 0.95), 0, 1.15, -0.55);
  sack.scale.set(1, 1.1, 0.9);
  sleigh.add(sack);
  const giftCols = [['#c8323c', '#e1b04a'], ['#2f7a55', '#f4efe4'], ['#2c4a8a', '#e1b04a']];
  giftCols.forEach(([c, r], i) => {
    const gf = gift(0.28, c, r);
    gf.position.set((i - 1) * 0.22, 1.42 + (i === 1 ? 0.08 : 0), -0.55 + (i - 1) * 0.05);
    gf.rotation.set(0.2 * (i - 1), i, 0.15);
    sleigh.add(gf);
  });
  // lanterne à l'avant
  sleigh.add(m(new THREE.SphereGeometry(0.06, 12, 10), glow(2.2, 1.4, 0.55), 0.48, 1.12, 0.98));

  // attelage : 2 paires de rennes
  const deer = [];
  [[2.1, false], [3.6, true]].forEach(([z, lead]) => {
    for (const x of [-0.42, 0.42]) {
      const r = reindeer(lead && x < 0);
      r.position.set(x, -0.2, z);
      r.userData.phase = Math.random() * 3;
      sleigh.add(r);
      deer.push(r);
    }
  });
  // rênes
  const reinMat = std('#3a1a10', 0.6);
  for (const x of [-0.42, 0.42]) {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x * 0.4, 1.05, 0.45), new THREE.Vector3(x, 0.95, 1.5), new THREE.Vector3(x, 0.95, 2.3), new THREE.Vector3(x, 0.95, 3.8),
    ]);
    sleigh.add(m(new THREE.TubeGeometry(c, 30, 0.015, 5), reinMat));
  }

  // lumière chaude qui accompagne le traîneau
  const light = new THREE.PointLight('#ffcf8a', 0, 10, 1.6);
  light.position.set(0, 1.4, 0.6);
  sleigh.add(light);

  // position locale du sac (point de départ du cadeau)
  const sackPoint = new THREE.Vector3(0, 1.2, -0.55);

  return {
    root,
    sleigh,
    light,
    sackPoint,
    animate(t) {
      deer.forEach((d) => d.userData.animate(t + d.userData.phase));
      sleigh.position.y = Math.sin(t * 4.5) * 0.06;
      sleigh.rotation.z = Math.sin(t * 2.2) * 0.03;
    },
  };
}

// ---------------------------------------------------------------- Poussière d'étoiles
function stardust(count = 900) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const size = new Float32Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('life', new THREE.BufferAttribute(life, 1));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { map: { value: softDot() }, uPx: { value: 420 } },
    vertexShader: `uniform float uPx; attribute float life; attribute float size; varying float vL;
      void main(){ vL = life; vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
      gl_PointSize = size * life * uPx / -mv.z; }`,
    fragmentShader: `uniform sampler2D map; varying float vL;
      void main(){ vec4 t = texture2D(map, gl_PointCoord); vec3 c = mix(vec3(1.6,1.05,.45), vec3(2.2,2.,1.7), vL);
      gl_FragColor = vec4(c, t.a * vL); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  let next = 0;
  return {
    points,
    emit(p, n = 6, spread = 0.35) {
      for (let k = 0; k < n; k++) {
        const i = next++ % count;
        pos[i * 3] = p.x + (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * spread;
        pos[i * 3 + 2] = p.z + (Math.random() - 0.5) * spread;
        vel[i * 3] = (Math.random() - 0.5) * 0.4;
        vel[i * 3 + 1] = -0.25 - Math.random() * 0.5;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        life[i] = 1;
        size[i] = 0.12 + Math.random() * 0.22;
      }
    },
    burst(p, n = 160) {
      for (let k = 0; k < n; k++) {
        const i = next++ % count;
        const d = new THREE.Vector3().randomDirection().multiplyScalar(1.5 + Math.random() * 3.5);
        pos.set([p.x, p.y, p.z], i * 3);
        vel.set([d.x, Math.abs(d.y) + 1.2, d.z], i * 3);
        life[i] = 1;
        size[i] = 0.2 + Math.random() * 0.35;
      }
    },
    update(dt) {
      for (let i = 0; i < count; i++) {
        if (life[i] <= 0) continue;
        life[i] = Math.max(0, life[i] - dt * 0.55);
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        vel[i * 3 + 1] -= dt * 0.6;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.life.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- Réalisation
const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Lance la séquence. `on` reçoit les événements : caption(texte|null), bells(durée), chime(), done().
 * Renvoie { skip() }.
 */
export function playIntro(world, { isMobile, overview, on }) {
  const { scene, camera } = world;
  const S = buildSleigh();
  S.root.scale.setScalar(1.15);
  scene.add(S.root);
  const dust = stardust(isMobile ? 500 : 900);
  scene.add(dust.points);

  const chim = world.chimneyTop.clone();
  // le traîneau s'arrête de façon à ce que la hotte soit à l'aplomb de la cheminée
  const hoverDir = new THREE.Vector3(-1, 0, 0.15).normalize(); // il arrive par la droite
  const hover = chim.clone().add(new THREE.Vector3(0, 1.2, 0)).add(hoverDir.clone().multiplyScalar(0.55 * 1.15));

  const arrival = new THREE.CatmullRomCurve3([
    new THREE.Vector3(70, 34, -70),
    new THREE.Vector3(38, 26, -30),
    new THREE.Vector3(10, 19, 4),
    new THREE.Vector3(-12, 16, -4),
    new THREE.Vector3(-8, 12, -18),
    hover.clone().add(hoverDir.clone().multiplyScalar(-9)).setY(hover.y + 1.2),
    hover.clone(),
  ]);
  const departure = new THREE.CatmullRomCurve3([
    hover.clone(),
    hover.clone().add(hoverDir.clone().multiplyScalar(8)).setY(hover.y + 2),
    new THREE.Vector3(-26, 20, -30),
    new THREE.Vector3(-60, 44, -40),
    new THREE.Vector3(-120, 90, -60),
  ]);

  // gros cadeau qui tombe dans la cheminée
  const present = gift(0.55, '#c8323c', '#e1b04a');
  present.visible = false;
  scene.add(present);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: new THREE.Color(3, 2.2, 1.1), transparent: true, depthWrite: false, opacity: 0 }));
  flash.position.copy(chim).add(new THREE.Vector3(0, 0.4, 0));
  scene.add(flash);
  const flashLight = new THREE.PointLight('#ffc773', 0, 30, 1.5);
  flashLight.position.copy(flash.position);
  scene.add(flashLight);

  // Calendrier (secondes)
  const T = { arriveStart: 2.2, arriveEnd: 8.4, drop: 8.9, land: 9.9, departStart: 10.6, departEnd: 15.0, cam3: 14.2, end: 17.6 };

  const camKeys = [
    { t: 0, pos: new THREE.Vector3(5, 1.6, 26), look: new THREE.Vector3(2, 9, -8) },
    { t: 3.0, pos: new THREE.Vector3(7, 2.2, 22), look: new THREE.Vector3(10, 14, -10) },
    { t: 8.4, pos: new THREE.Vector3(9, 5.2, -2), look: chim.clone().add(new THREE.Vector3(0, 0.8, 0)) },
    { t: 11.0, pos: new THREE.Vector3(7, 4.5, 2), look: chim.clone().add(new THREE.Vector3(0, -1.5, 6)) },
    { t: T.cam3 + 1.6, pos: overview.pos.clone(), look: overview.target.clone() },
  ];
  const tmpLook = new THREE.Vector3();
  const lookNow = new THREE.Vector3(2, 9, -8);
  camera.position.copy(camKeys[0].pos);
  camera.lookAt(lookNow);

  let time = 0;
  let finished = false;
  let dropped = false;
  let burst = false;
  let bellsOn = false;
  let lastCap = -1;
  const captions = [
    [0.4, 3.6, '24 décembre, 23 h 58.<br>Le village dort encore.'],
    [4.0, 7.8, 'Quelqu’un est passé un peu en avance…'],
    [8.6, 11.2, 'Un seul cadeau, déposé dans la cheminée…'],
    [11.6, 15.0, '… et tout le village s’est réveillé.'],
  ];
  const sleighWorld = new THREE.Vector3();
  const sackWorld = new THREE.Vector3();
  let presentFrom = null;

  world.setIllumination(chim, -10);

  function sleighAt(curve, u) {
    const p = curve.getPointAt(THREE.MathUtils.clamp(u, 0, 1));
    const ahead = curve.getPointAt(THREE.MathUtils.clamp(u + 0.01, 0, 1));
    S.root.position.copy(p);
    if (ahead.distanceToSquared(p) > 1e-6) {
      const m4 = new THREE.Matrix4().lookAt(ahead, p, new THREE.Vector3(0, 1, 0));
      const q = new THREE.Quaternion().setFromRotationMatrix(m4);
      S.root.quaternion.slerp(q, 0.12);
    }
  }

  function step(dt) {
    if (finished) return;
    time += dt;
    const t = time;
    S.animate(t);
    dust.update(dt);

    // ---- traîneau
    if (t < T.arriveStart) {
      S.root.visible = false;
    } else if (t < T.arriveEnd) {
      S.root.visible = true;
      const k = (t - T.arriveStart) / (T.arriveEnd - T.arriveStart);
      sleighAt(arrival, 1 - (1 - k) ** 2.2);
      if (!bellsOn) {
        bellsOn = true;
        on.bells?.(T.departEnd - T.arriveStart);
      }
    } else if (t < T.departStart) {
      S.root.position.copy(hover).add(new THREE.Vector3(0, Math.sin(t * 2) * 0.08, 0));
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(hover.clone().add(hoverDir), hover, new THREE.Vector3(0, 1, 0)));
      S.root.quaternion.slerp(q, 0.06);
    } else if (t < T.departEnd) {
      const k = (t - T.departStart) / (T.departEnd - T.departStart);
      sleighAt(departure, k ** 1.8);
    } else S.root.visible = false;
    S.light.intensity = S.root.visible ? 7 : 0;

    S.root.getWorldPosition(sleighWorld);
    if (S.root.visible) {
      // poussière d'étoiles sous les patins
      const back = new THREE.Vector3(0, 0.1, -1.3).applyQuaternion(S.root.quaternion).multiplyScalar(1.15).add(S.root.position);
      dust.emit(back, isMobile ? 4 : 8);
    }

    // ---- cadeau
    if (t >= T.drop && t < T.land) {
      if (!dropped) {
        dropped = true;
        presentFrom = S.sackPoint.clone().applyMatrix4(S.sleigh.matrixWorld);
        present.visible = true;
      }
      const k = (t - T.drop) / (T.land - T.drop);
      present.position.lerpVectors(presentFrom, chim.clone().add(new THREE.Vector3(0, -0.9, 0)), k * k);
      present.rotation.set(k * 4, k * 6, k * 2);
      present.scale.setScalar(1 - smooth(0.75, 1, k) * 0.6);
      dust.emit(present.position, 2, 0.2);
    } else if (t >= T.land) present.visible = false;
    if (t >= T.land && !burst) {
      burst = true;
      dust.burst(chim.clone().add(new THREE.Vector3(0, 0.4, 0)), isMobile ? 120 : 220);
      on.chime?.();
    }
    const fl = t >= T.land ? Math.exp(-(t - T.land) * 2.2) : 0;
    flash.material.opacity = fl;
    flash.scale.setScalar(2 + (1 - fl) * 8);
    flashLight.intensity = fl * 120;

    // ---- le village s'allume en vague depuis la cheminée
    if (t >= T.land) world.setIllumination(chim, (t - T.land) * 11);

    // ---- caméra
    let i = 0;
    while (i < camKeys.length - 2 && t > camKeys[i + 1].t) i++;
    const a = camKeys[i];
    const b = camKeys[i + 1];
    const k = smooth(a.t, b.t, t);
    camera.position.lerpVectors(a.pos, b.pos, k);
    tmpLook.lerpVectors(a.look, b.look, k);
    // pendant l'arrivée, la caméra suit le traîneau du regard
    const follow = smooth(T.arriveStart, T.arriveStart + 1.2, t) * (1 - smooth(T.arriveEnd - 0.6, T.arriveEnd + 0.4, t)) +
      smooth(T.departStart, T.departStart + 0.8, t) * (1 - smooth(T.departStart + 2.6, T.departStart + 3.6, t)) * 0.7;
    if (S.root.visible) tmpLook.lerp(sleighWorld, follow);
    lookNow.lerp(tmpLook, Math.min(1, dt * 3.5));
    camera.lookAt(lookNow);

    // ---- sous-titres
    let cap = -1;
    captions.forEach(([s, e], idx) => {
      if (t >= s && t < e) cap = idx;
    });
    if (cap !== lastCap) {
      lastCap = cap;
      on.caption?.(cap >= 0 ? captions[cap][2] : null);
    }
    if (t >= T.end - 2.2 && lastCap !== 99) {
      lastCap = 99;
      on.title?.();
    }

    if (t >= T.end) finish();
  }

  function cleanup() {
    scene.remove(S.root, present, flash, flashLight);
    setTimeout(() => scene.remove(dust.points), 3000);
  }

  function finish() {
    if (finished) return;
    finished = true;
    world.setIllumination(chim, 999);
    on.caption?.(null);
    cleanup();
    on.done?.(lookNow.clone());
  }

  world.addUpdater((dt) => finished && dust.update(dt));
  world.setDirector(step);

  return {
    skip() {
      if (finished) return;
      camera.position.copy(overview.pos);
      lookNow.copy(overview.target);
      camera.lookAt(lookNow);
      finish();
    },
  };
}

// Plan d'attente avant le lancement : caméra au ras de la place, le village dans la pénombre.
export function prelude(world) {
  const { camera } = world;
  const look = new THREE.Vector3(2, 9, -8);
  let t = 0;
  world.setIllumination(world.chimneyTop, -10);
  world.setDirector((dt) => {
    t += dt;
    camera.position.set(5 + Math.sin(t * 0.25) * 0.6, 1.6 + Math.sin(t * 0.4) * 0.1, 26);
    camera.lookAt(look);
  });
}
