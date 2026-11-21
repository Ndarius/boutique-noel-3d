import * as THREE from 'three';

// Étiquettes cliquables accrochées au-dessus de chaque chalet dans la 3D.
// Elles rendent évident que le village se touche, avec des cibles assez grandes pour le doigt.
export function createHotspots(world, { onOpen, isVisible }) {
  const layer = document.createElement('div');
  layer.className = 'pins';
  layer.setAttribute('aria-label', 'Chalets du village');
  document.body.appendChild(layer);

  const pins = world.chalets.map((c) => {
    const b = document.createElement('button');
    b.className = 'pin';
    b.style.setProperty('--accent', c.rayon.accent);
    b.innerHTML = `<span class="pin-n">${c.rayon.number}</span><span class="pin-t">${c.rayon.short}</span>`;
    b.setAttribute('aria-label', `Entrer dans ${c.rayon.name}`);
    b.addEventListener('click', () => onOpen(c.rayon));
    layer.appendChild(b);
    const anchor = c.pos.clone().add(c.inward.clone().multiplyScalar(1.6)).setY(6.4);
    return { b, anchor, c };
  });

  const v = new THREE.Vector3();
  world.addUpdater(() => {
    const show = isVisible();
    layer.classList.toggle('on', show);
    if (!show) return;
    // zone utile : sous la barre du haut, au-dessus du volet (mobile) ou à droite du menu (ordinateur)
    const side = document.querySelector('#side-panel');
    const r = side && !side.classList.contains('is-hidden') && !side.classList.contains('collapsed') ? side.getBoundingClientRect() : null;
    const narrow = innerWidth <= 760;
    const minY = 64;
    const maxY = narrow && r ? r.top - 8 : innerHeight - 90;
    const minX = !narrow && r ? r.right + 8 : 4;
    for (const p of pins) {
      v.copy(p.anchor).project(world.camera);
      const x = (v.x * 0.5 + 0.5) * innerWidth;
      const y = (-v.y * 0.5 + 0.5) * innerHeight;
      const ok = v.z < 1 && x > minX && x < innerWidth - 4 && y > minY && y < maxY;
      p.b.classList.toggle('hide', !ok);
      if (ok) {
        // garde l'étiquette entière à l'écran
        const half = (p.w ||= p.b.offsetWidth) / 2;
        const cx = Math.min(Math.max(x, half + 6), innerWidth - half - 6);
        p.b.style.transform = `translate(${cx.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      }
    }
  });
  return layer;
}

// Petit guide affiché une seule fois : montre que la 3D s'explore du doigt.
export function showCoach() {
  try {
    if (localStorage.getItem('msdn-guide-vu') === '1') return;
  } catch {
    /* on l'affiche */
  }
  const el = document.createElement('div');
  el.className = 'coach';
  // toujours juste au-dessus du volet, jamais sur les produits ; masqué si la place manque
  const place = () => {
    if (!el.isConnected) return;
    const side = document.querySelector('#side-panel');
    const r = side && !side.classList.contains('is-hidden') ? side.getBoundingClientRect() : null;
    if (r && innerWidth <= 760) {
      el.style.bottom = `${innerHeight - r.top + 12}px`;
      el.classList.toggle('no-room', r.top < 230);
    }
    requestAnimationFrame(place);
  };
  requestAnimationFrame(place);
  el.innerHTML = `<span class="coach-hand" aria-hidden="true">👆</span><span>Glissez pour tourner autour du village<br><strong>Touchez un chalet pour y entrer</strong></span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  const hide = () => {
    el.classList.remove('on');
    setTimeout(() => el.remove(), 600);
    try {
      localStorage.setItem('msdn-guide-vu', '1');
    } catch {
      /* non mémorisé */
    }
    removeEventListener('pointerdown', hide, true);
  };
  addEventListener('pointerdown', hide, true);
  setTimeout(hide, 9000);
}
