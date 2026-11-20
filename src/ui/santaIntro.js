// Animation de l'écran de chargement : le traîneau du Père Noël traverse le ciel,
// se pose au-dessus de la cheminée, y dépose un cadeau, puis repart.
// Dessin SVG original, animé en JavaScript (aucune image externe).

const SVG = `
<svg class="santa-svg" viewBox="0 0 600 270" role="img" aria-label="Le Père Noël dépose un cadeau dans la cheminée">
  <defs>
    <radialGradient id="si-win" cx="50%" cy="50%" r="60%">
      <stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#f0a040"/>
    </radialGradient>
    <radialGradient id="si-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="si-sleigh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0404a"/><stop offset="1" stop-color="#a3101c"/>
    </linearGradient>
    <symbol id="si-deer" viewBox="-30 -42 66 60" overflow="visible">
      <g class="si-legs-b"><path d="M-14 0 L-18 16 M10 0 L14 16"/></g>
      <ellipse cx="0" cy="-4" rx="19" ry="8.5" fill="#8b5a3c"/>
      <ellipse cx="-4" cy="-1" rx="10" ry="4" fill="#c9a27c" opacity=".7"/>
      <path d="M13 -8 L20 -24 L27 -22 L20 -6 Z" fill="#8b5a3c"/>
      <ellipse cx="25" cy="-26" rx="8" ry="5" fill="#8b5a3c" transform="rotate(-18 25 -26)"/>
      <path class="si-antler" d="M21 -30 L17 -40 M19 -35 L13 -38 M25 -31 L27 -42 M26 -37 L32 -39"/>
      <circle cx="26" cy="-28" r="1.3" fill="#1b1b1b"/>
      <path d="M-19 -6 Q-25 -10 -23 -2" fill="none" stroke="#f3e6d6" stroke-width="3" stroke-linecap="round"/>
      <g class="si-legs-a"><path d="M-10 2 L-12 17 M14 2 L18 17"/></g>
    </symbol>
  </defs>

  <!-- maison enneigée -->
  <g class="si-house">
    <circle cx="250" cy="215" r="70" fill="url(#si-glow)"/>
    <rect x="160" y="180" width="200" height="90" fill="#24324f"/>
    <rect x="186" y="200" width="36" height="34" rx="3" fill="url(#si-win)"/>
    <rect x="292" y="200" width="36" height="34" rx="3" fill="url(#si-win)"/>
    <path d="M204 200 V234 M186 217 H222 M310 200 V234 M292 217 H328" stroke="#24324f" stroke-width="3"/>
    <rect x="240" y="226" width="34" height="44" rx="3" fill="#6b3f26"/>
    <circle cx="257" cy="242" r="9" fill="none" stroke="#2f7a55" stroke-width="5"/>
    <circle cx="257" cy="234" r="2.4" fill="#c8323c"/>
  </g>
  <g class="si-gift-layer"></g>
  <g class="si-roof">
    <path d="M145 186 L260 118 L375 186 Z" fill="#3b2a3a"/>
    <path d="M140 189 L260 116 L380 189 L372 193 Q340 182 318 192 Q290 182 262 190 Q232 180 204 191 Q176 181 148 193 Z" fill="#eef3fb"/>
    <rect x="302" y="104" width="34" height="50" fill="#8a3a2c"/>
    <path d="M302 116 H336 M302 128 H336 M302 140 H336 M319 104 V116 M310 116 V128 M327 116 V128 M319 128 V140" stroke="#6e2a1f" stroke-width="1.5"/>
    <rect x="297" y="96" width="44" height="12" rx="3" fill="#a24434"/>
    <path d="M295 98 Q305 88 318 95 Q330 87 343 98 Z" fill="#f4f7fc"/>
  </g>
  <g class="si-smoke"></g>
  <path d="M0 270 Q120 250 240 262 T600 255 V270 Z" fill="#eef3fb" opacity=".9"/>

  <!-- poussière d'étoiles + traîneau -->
  <g class="si-trail"></g>
  <g class="si-sleigh">
    <g class="si-bob">
      <path class="si-rein" d="M-2 -26 Q45 -12 97 -20 M-2 -26 Q80 -6 157 -20"/>
      <use href="#si-deer" x="110" y="-44" width="66" height="60" class="si-deer-1"/>
      <circle class="si-nose" cx="173" cy="-29" r="3.2"/>
      <use href="#si-deer" x="50" y="-44" width="66" height="60" class="si-deer-2"/>
      <circle cx="-40" cy="-24" r="17" fill="#8a5a33"/>
      <path d="M-46 -40 Q-40 -46 -34 -40" stroke="#5a3a20" stroke-width="3" fill="none"/>
      <rect class="si-sack-gift" x="-46" y="-48" width="13" height="11" rx="1.5" fill="#2f7a55"/>
      <ellipse cx="-12" cy="-20" rx="14" ry="16" fill="#c8323c"/>
      <rect x="-26" y="-14" width="28" height="4" fill="#1b1b1b"/>
      <circle cx="-8" cy="-38" r="8.5" fill="#f1c9a5"/>
      <path d="M-17 -38 Q-8 -18 1 -38 Q-8 -32 -17 -38 Z" fill="#fbfbf8"/>
      <circle cx="-5" cy="-39" r="1.2" fill="#1b1b1b"/>
      <path d="M-18 -42 Q-12 -62 -30 -58 L-26 -52 Q-20 -54 -18 -46 Z" fill="#c8323c"/>
      <rect x="-19" y="-46" width="20" height="5" rx="2.5" fill="#fbfbf8"/>
      <circle cx="-30" cy="-57" r="3.6" fill="#fbfbf8"/>
      <path d="M2 -24 L12 -30" stroke="#c8323c" stroke-width="6" stroke-linecap="round"/>
      <path d="M-58 -12 Q-64 8 -44 10 L22 10 Q38 8 38 -6 L34 -14 L-54 -14 Z" fill="url(#si-sleigh)" stroke="#e8c27a" stroke-width="2"/>
      <path d="M-40 -2 Q-20 -10 0 -2 T30 -4" stroke="#e8c27a" stroke-width="1.5" fill="none" opacity=".8"/>
      <path d="M-30 10 L-34 22 M14 10 L18 22" stroke="#e8c27a" stroke-width="2.5"/>
      <path d="M-62 22 L34 22 Q52 22 48 8" stroke="#e8c27a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

const P = {
  start: [-260, 30],
  hover: [318, 70], // au-dessus de la cheminée
  end: [880, -80],
};

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t * t;
const bez = (a, c1, c2, b, t) => {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * a[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * b[i]);
};

// Déroulé (secondes) : arrivée, vol stationnaire + cadeau, départ, pause
const T_IN = 2.6;
const T_HOLD = 1.6;
const T_OUT = 2.2;
const T_REST = 1.0;
const LOOP = T_IN + T_HOLD + T_OUT + T_REST;

export function startSantaIntro(container) {
  container.innerHTML = SVG;
  const svg = container.querySelector('svg');
  const sleigh = svg.querySelector('.si-sleigh');
  const bob = svg.querySelector('.si-bob');
  const sackGift = svg.querySelector('.si-sack-gift');
  const giftLayer = svg.querySelector('.si-gift-layer');
  const trailLayer = svg.querySelector('.si-trail');
  const smokeLayer = svg.querySelector('.si-smoke');
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cadeau qui tombe dans la cheminée (dessiné derrière le toit)
  const gift = document.createElementNS(NS, 'g');
  gift.innerHTML =
    '<rect x="-8" y="-7" width="16" height="14" rx="1.5" fill="#c8323c"/><rect x="-1.6" y="-7" width="3.2" height="14" fill="#e8c27a"/><rect x="-8" y="-1.6" width="16" height="3.2" fill="#e8c27a"/><path d="M0 -7 Q-6 -13 -3 -8 M0 -7 Q6 -13 3 -8" stroke="#e8c27a" stroke-width="2" fill="none"/>';
  gift.style.opacity = 0;
  giftLayer.appendChild(gift);

  // Étincelle à la sortie de la cheminée
  const spark = document.createElementNS(NS, 'g');
  spark.innerHTML = '<circle r="18" fill="url(#si-glow)"/><path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#ffe7a8"/>';
  spark.setAttribute('transform', 'translate(319 96)');
  spark.style.opacity = 0;
  svg.appendChild(spark);

  // Fumée
  const puffs = [];
  for (let i = 0; i < 5; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('fill', '#c9d3e6');
    smokeLayer.appendChild(c);
    puffs.push({ el: c, off: i / 5 });
  }

  // Traînée d'étoiles
  const trail = [];
  for (let i = 0; i < 22; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('fill', i % 3 ? '#ffe7a8' : '#ffffff');
    trailLayer.appendChild(c);
    trail.push({ el: c, x: -999, y: -999, life: 0 });
  }
  let trailIdx = 0;
  let lastEmit = 0;

  function place(x, y, angle) {
    sleigh.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(0.92)`);
  }

  if (reduced) {
    place(P.hover[0], P.hover[1], 0);
    return () => {};
  }

  let raf = 0;
  let t0 = performance.now();
  let prev = null;
  let angle = 0;
  function frame(now) {
    const t = ((now - t0) / 1000) % LOOP;
    const time = (now - t0) / 1000;
    let pos;
    let giftT = -1;
    let flying = true;

    if (t < T_IN) {
      const k = easeOut(t / T_IN);
      pos = bez(P.start, [-40, -40], [200, 130], P.hover, k);
    } else if (t < T_IN + T_HOLD) {
      const k = (t - T_IN) / T_HOLD;
      pos = [P.hover[0] + Math.sin(k * Math.PI * 2) * 3, P.hover[1] + Math.sin(k * Math.PI) * 4];
      giftT = k;
      flying = k > 0.85;
    } else if (t < T_IN + T_HOLD + T_OUT) {
      const k = easeIn((t - T_IN - T_HOLD) / T_OUT);
      pos = bez(P.hover, [400, 40], [560, -10], P.end, k);
    } else {
      pos = [...P.end];
    }

    // inclinaison selon la trajectoire
    let target = 0;
    if (prev) {
      const dx = pos[0] - prev[0];
      const dy = pos[1] - prev[1];
      if (Math.hypot(dx, dy) > 1.2 && dx > 0) target = Math.max(-16, Math.min(16, (Math.atan2(dy, dx) * 180) / Math.PI));
    }
    prev = pos;
    angle += (target - angle) * 0.12;
    place(pos[0], pos[1], angle);
    bob.setAttribute('transform', `translate(0 ${(Math.sin(time * 9) * 1.6).toFixed(2)})`);

    // cadeau : quitte le sac, tombe dans la cheminée
    const showSack = t < T_IN + T_HOLD * 0.15 || t > LOOP - 0.05;
    sackGift.style.opacity = showSack ? 1 : 0;
    if (giftT >= 0.15 && giftT <= 0.75) {
      const k = (giftT - 0.15) / 0.6;
      const gx = pos[0] - 36 + (319 - (pos[0] - 36)) * Math.min(1, k * 1.6);
      const gy = pos[1] - 42 + easeIn(k) * 120;
      gift.setAttribute('transform', `translate(${gx.toFixed(1)} ${gy.toFixed(1)}) rotate(${(k * 200).toFixed(0)})`);
      gift.style.opacity = 1;
    } else gift.style.opacity = 0;
    const sk = giftT >= 0.68 && giftT <= 1 ? Math.sin(((giftT - 0.68) / 0.32) * Math.PI) : 0;
    spark.style.opacity = sk.toFixed(2);
    spark.setAttribute('transform', `translate(319 92) scale(${(0.6 + sk * 0.8).toFixed(2)}) rotate(${(time * 90) % 360})`);

    // poussière d'étoiles derrière le traîneau
    if (flying && now - lastEmit > 45 && pos[0] > -80 && pos[0] < 680) {
      lastEmit = now;
      const p = trail[trailIdx++ % trail.length];
      p.x = pos[0] - 62 + (Math.random() - 0.5) * 8;
      p.y = pos[1] + 18 + (Math.random() - 0.5) * 8;
      p.life = 1;
    }
    for (const p of trail) {
      p.life = Math.max(0, p.life - 0.022);
      p.y += 0.25;
      p.el.setAttribute('cx', p.x.toFixed(1));
      p.el.setAttribute('cy', p.y.toFixed(1));
      p.el.setAttribute('r', (p.life * 2.6).toFixed(2));
      p.el.setAttribute('opacity', p.life.toFixed(2));
    }

    // fumée qui monte de la cheminée
    for (const s of puffs) {
      const k = (time * 0.28 + s.off) % 1;
      s.el.setAttribute('cx', (319 + Math.sin(k * 6 + s.off * 9) * 6 - k * 18).toFixed(1));
      s.el.setAttribute('cy', (92 - k * 70).toFixed(1));
      s.el.setAttribute('r', (4 + k * 10).toFixed(1));
      s.el.setAttribute('opacity', ((1 - k) * 0.35).toFixed(2));
    }

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
