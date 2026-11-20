import './style.css';
import * as THREE from 'three';
import { RAYONS, BRAND, findRayon, findProduct, formatPrice } from './data/catalog.js';
import { createWorld, isMobile } from './scene/world.js';
import { renderThumbnails } from './scene/thumbnails.js';
import { ChristmasMusic } from './audio/music.js';
import { createCart } from './ui/cart.js';
import * as V from './ui/views.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const music = new ChristmasMusic();
const cart = createCart();
let world;
let thumbs = new Map();
let entered = false;
let route = { view: 'home' };
let qty = 1;
let sideKey = '';

// ====================================================================== Écran d'accueil
(function loaderSnow() {
  const box = $('.loader-snow');
  for (let i = 0; i < 46; i++) {
    const f = document.createElement('i');
    const s = 2 + Math.random() * 5;
    f.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;opacity:${0.3 + Math.random() * 0.6};animation-duration:${6 + Math.random() * 8}s;animation-delay:${-Math.random() * 12}s`;
    box.appendChild(f);
  }
})();

function progress(p, text) {
  $('#loader-bar').style.width = `${Math.round(p * 100)}%`;
  if (text) $('#loader-status').textContent = text;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

async function boot() {
  if (!webglAvailable()) {
    progress(1, "Votre navigateur ne prend pas en charge la 3D (WebGL). Essayez avec Chrome, Edge, Firefox ou Safari récents.");
    return;
  }
  progress(0.08, 'Accrochage des guirlandes…');
  await Promise.race([document.fonts.load('700 70px "Playfair Display"'), wait(2500)]).catch(() => {});
  progress(0.3, 'Construction des chalets…');
  await nextFrame();
  world = createWorld($('#scene'), RAYONS);
  progress(0.65, 'Emballage des cadeaux…');
  await nextFrame();
  thumbs = await renderThumbnails(world.products);
  progress(1, 'Le marché est ouvert !');
  route = parse(location.pathname);
  renderAll();
  $('#side-panel').classList.add('is-hidden');
  $('#loader-actions').hidden = false;
  $('#enter-music').focus();
  setupPointer();
}

function enter(withMusic) {
  if (entered) return;
  entered = true;
  if (withMusic) music.start();
  $('#loader').classList.add('gone');
  world.stopIntro();
  applyRoute(parse(location.pathname), { first: true });
}
$('#enter-music').addEventListener('click', () => enter(true));
$('#enter-silent').addEventListener('click', () => enter(false));

// ====================================================================== Routeur (une adresse par rayon)
function parse(path) {
  const parts = decodeURIComponent(path).split('/').filter(Boolean);
  if (!parts.length) return { view: 'home' };
  if (parts[0] === 'rayon') {
    const rayon = findRayon(parts[1]);
    if (!rayon) return { view: 'home', notFound: true };
    if (parts[2]) {
      const product = findProduct(rayon.slug, parts[2]);
      return product ? { view: 'product', rayon, product } : { view: 'rayon', rayon, notFound: true };
    }
    return { view: 'rayon', rayon };
  }
  if (parts[0] === 'panier') return { view: 'home', cart: true };
  return { view: 'home', notFound: true };
}

const canonical = (r) => (r.view === 'product' ? V.productUrl(r.rayon, r.product) : r.view === 'rayon' ? V.rayonUrl(r.rayon) : '/');

function navigate(path) {
  if (path === location.pathname) {
    applyRoute(parse(path));
    return;
  }
  history.pushState({}, '', path);
  applyRoute(parse(path));
}
addEventListener('popstate', () => entered && applyRoute(parse(location.pathname)));

function applyRoute(next, { first = false } = {}) {
  const prev = route;
  route = next;
  if (next.notFound) {
    toast("Cette adresse n'existe pas — nous vous ramenons au bon endroit.");
    history.replaceState({}, '', canonical(next));
  } else if (next.cart) history.replaceState({}, '', '/');
  if (next.cart) openCart();

  if (next.product?.slug !== prev.product?.slug) qty = 1;
  updateTitle();
  renderAll();
  moveCamera(prev, next, first);
}

function moveCamera(prev, next, first) {
  if (!world) return;
  const chalet = next.rayon && world.chalets.find((c) => c.rayon === next.rayon);
  const sameRayon = prev.rayon && prev.rayon === next.rayon;
  if (next.view === 'home') {
    world.setSelected(null);
    const v = world.views.overview();
    world.flyTo(v.pos, v.target, { mode: 'overview', duration: first ? 3.2 : 2.2 });
  } else if (next.view === 'rayon') {
    world.setSelected(null);
    const v = world.views.chalet(chalet);
    world.flyTo(v.pos, v.target, { mode: 'chalet', duration: first ? 3.4 : sameRayon ? 1.2 : 2.3 });
  } else {
    const entry = world.products.find((p) => p.product === next.product && p.rayon === next.rayon);
    world.setSelected(entry);
    const v = world.views.product(entry);
    world.flyTo(v.pos, v.target, { mode: 'product', duration: first ? 3.6 : sameRayon ? 1.3 : 2.6, azimuthRange: 0.5 });
  }
}

function updateTitle() {
  const r = route;
  const meta = document.querySelector('meta[name="description"]');
  if (r.view === 'product') {
    document.title = `${r.product.name} — ${r.rayon.name} — ${BRAND.name}`;
    meta.content = r.product.description;
  } else if (r.view === 'rayon') {
    document.title = `${r.rayon.name} · Rayon ${r.rayon.number} — ${BRAND.name}`;
    meta.content = r.rayon.description;
  } else {
    document.title = `${BRAND.name} — ${BRAND.tagline}`;
    meta.content = 'Promenez-vous dans notre marché de Noël en 3D : 5 rayons de décorations — sapins, boules, lumières, crèches et cadeaux.';
  }
}

// ====================================================================== Rendu de l'interface
function renderAll() {
  const current = route.rayon?.slug;
  $('#rayon-nav').innerHTML = V.navLinks(current);
  $('#dock-dots').innerHTML = V.dockDots(current);
  $('#dock-home').toggleAttribute('aria-current', route.view === 'home');
  if (route.view === 'home') $('#dock-home').setAttribute('aria-current', 'page');

  const side = $('#side-panel');
  const key = route.view === 'home' ? 'home' : `rayon:${current}:${route.product?.slug || ''}`;
  if (key !== sideKey) {
    const keepScroll = sideKey.startsWith(`rayon:${current}:`) && route.view !== 'home';
    const scroll = side.querySelector('.panel-scroll')?.scrollTop || 0;
    side.innerHTML = route.view === 'home' ? V.homePanel() : V.rayonPanel(route.rayon, thumbs, route.product?.slug);
    if (keepScroll) side.querySelector('.panel-scroll').scrollTop = scroll;
    sideKey = key;
  }
  side.classList.toggle('is-hidden', !entered || (isMobile && route.view === 'product'));

  const pp = $('#product-panel');
  if (route.view === 'product') {
    pp.innerHTML = V.productPanel(route.rayon, route.product, thumbs, qty);
    pp.hidden = false;
    pp.style.animation = 'none';
    void pp.offsetWidth;
    pp.style.animation = '';
  } else pp.hidden = true;

  updateCartBadge(false);
}

function updateCartBadge(bump = true) {
  const n = cart.count();
  const b = $('#cart-count');
  b.hidden = n === 0;
  b.textContent = n;
  if (bump) {
    b.classList.remove('bump');
    void b.offsetWidth;
    b.classList.add('bump');
  }
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ---------------------------------------------------------------- Panier
function openCart() {
  $('#cart-drawer').innerHTML = V.cartDrawer(cart, thumbs);
  $('#cart-drawer').classList.add('open');
  $('#cart-drawer').setAttribute('aria-hidden', 'false');
  $('#cart-backdrop').hidden = false;
  setTimeout(() => $('#cart-drawer [data-action="close-cart"]')?.focus(), 50);
}
function closeCart() {
  $('#cart-drawer').classList.remove('open');
  $('#cart-drawer').setAttribute('aria-hidden', 'true');
  $('#cart-backdrop').hidden = true;
}
const cartOpen = () => $('#cart-drawer').classList.contains('open');
cart.onChange(() => {
  updateCartBadge();
  if (cartOpen()) $('#cart-drawer').innerHTML = V.cartDrawer(cart, thumbs);
});
$('#cart-btn').addEventListener('click', openCart);
$('#cart-backdrop').addEventListener('click', closeCart);

// ---------------------------------------------------------------- Musique
const soundBtn = $('#sound-btn');
music.onChange((on) => soundBtn.setAttribute('aria-pressed', String(on)));
soundBtn.addEventListener('click', () => {
  music.toggle();
  toast(music.enabled ? '🎵 Musique de Noël activée' : 'Musique coupée');
});

// ---------------------------------------------------------------- Menu mobile
function closeMenu() {
  $('#rayon-nav').classList.remove('open');
  $('#menu-btn').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}
$('#menu-btn').addEventListener('click', () => {
  const open = !$('#rayon-nav').classList.contains('open');
  $('#rayon-nav').classList.toggle('open', open);
  $('#menu-btn').setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});

// ---------------------------------------------------------------- Dock
function stepRayon(dir) {
  const i = route.rayon ? RAYONS.indexOf(route.rayon) : dir > 0 ? -1 : RAYONS.length;
  const n = RAYONS[(i + dir + RAYONS.length) % RAYONS.length];
  navigate(V.rayonUrl(n));
}
function stepProduct(dir) {
  const list = route.rayon.products;
  const i = list.indexOf(route.product);
  navigate(V.productUrl(route.rayon, list[(i + dir + list.length) % list.length]));
}
$('#dock-prev').addEventListener('click', () => stepRayon(-1));
$('#dock-next').addEventListener('click', () => stepRayon(1));

// ---------------------------------------------------------------- Clics délégués
document.addEventListener('click', async (e) => {
  const a = e.target.closest('a[data-link]');
  if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    closeMenu();
    if (cartOpen()) closeCart();
    if (entered) navigate(a.getAttribute('href'));
    return;
  }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action } = btn.dataset;
  if (action === 'copy') {
    const url = location.origin + btn.dataset.path;
    try {
      await navigator.clipboard.writeText(url);
      toast('Adresse copiée : ' + url);
    } catch {
      toast(url);
    }
  } else if (action === 'qty-dec' || action === 'qty-inc') {
    qty = Math.max(1, Math.min(99, qty + (action === 'qty-inc' ? 1 : -1)));
    $('#qty-value').textContent = qty;
  } else if (action === 'add') {
    cart.add(route.rayon.slug, route.product.slug, qty);
    music.ding();
    toast(`✓ ${qty} × ${route.product.name} ajouté${qty > 1 ? 's' : ''} au panier`);
  } else if (action === 'cart-inc' || action === 'cart-dec') {
    const l = cart.lines().find((x) => x.rayon === btn.dataset.rayon && x.slug === btn.dataset.slug);
    if (l) cart.setQty(l.rayon, l.slug, l.qty + (action === 'cart-inc' ? 1 : -1));
  } else if (action === 'cart-rm') {
    cart.remove(btn.dataset.rayon, btn.dataset.slug);
  } else if (action === 'close-cart') {
    closeCart();
  } else if (action === 'checkout') {
    toast('Boutique de démonstration : le paiement en ligne n’est pas encore branché.');
  } else if (action === 'toggle-sheet') {
    $('#side-panel').classList.toggle('collapsed');
  }
});

// Survol des cartes produits → mise en avant dans la 3D
document.addEventListener('pointerover', (e) => {
  if (!world) return;
  const card = e.target.closest('[data-product]');
  const rc = e.target.closest('.rayon-card[data-rayon]');
  if (card && route.rayon) {
    world.setHovered(world.products.find((p) => p.rayon === route.rayon && p.product.slug === card.dataset.product));
  } else if (rc) {
    world.chalets.forEach((c) => (c.highlight = c.rayon.slug === rc.dataset.rayon));
  }
});
document.addEventListener('pointerout', (e) => {
  if (!world) return;
  if (e.target.closest('[data-product]')) world.setHovered(null);
  if (e.target.closest('.rayon-card')) world.chalets.forEach((c) => (c.highlight = false));
});

// ---------------------------------------------------------------- Clavier
addEventListener('keydown', (e) => {
  if (!entered) {
    if (e.key === 'Enter' && !$('#loader-actions').hidden && document.activeElement === document.body) enter(true);
    return;
  }
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'Escape') {
    if (cartOpen()) return closeCart();
    if ($('#rayon-nav').classList.contains('open')) return closeMenu();
    if (route.view === 'product') navigate(V.rayonUrl(route.rayon));
    else if (route.view === 'rayon') navigate('/');
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (cartOpen()) return;
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    route.view === 'product' ? stepProduct(dir) : stepRayon(dir);
  } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
    soundBtn.click();
  }
});

// ====================================================================== Interaction 3D (survol, clic)
function setupPointer() {
  const canvas = world.renderer.domElement;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tip = $('#tooltip');
  let hoverTarget = null;
  let down = null;

  function pick(x, y) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, world.camera);
    let targets;
    if (route.view === 'home') targets = world.chalets.map((c) => c.hit);
    else {
      const own = world.products.filter((p) => p.rayon === route.rayon).map((p) => p.hit);
      const hits = ray.intersectObjects(own, false);
      if (hits.length) return hits[0].object.userData;
      targets = world.chalets.filter((c) => c.rayon !== route.rayon).map((c) => c.hit);
    }
    const hits = ray.intersectObjects(targets, false);
    return hits[0]?.object.userData || null;
  }

  function setHover(t, x, y) {
    hoverTarget = t;
    document.body.classList.toggle('hovering', !!t);
    world.chalets.forEach((c) => (c.highlight = t?.type === 'chalet' && t.chalet === c));
    document.querySelectorAll('.rayon-card.hl, .prod-card.hl').forEach((el) => el.classList.remove('hl'));
    if (t?.type === 'product') {
      world.setHovered(t.entry);
      document.querySelector(`.prod-card[data-product="${t.entry.product.slug}"]`)?.classList.add('hl');
      tip.innerHTML = `<strong>${t.entry.product.name}</strong><span>${formatPrice(t.entry.product.price)} · cliquer pour voir</span>`;
    } else {
      world.setHovered(null);
      if (t?.type === 'chalet') {
        document.querySelector(`.rayon-card[data-rayon="${t.chalet.rayon.slug}"]`)?.classList.add('hl');
        tip.innerHTML = `<strong>Rayon ${t.chalet.rayon.number} · ${t.chalet.rayon.name}</strong><span>Cliquer pour entrer</span>`;
      }
    }
    tip.hidden = !t || isMobile;
    if (t) {
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    }
  }

  let raf = 0;
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || down?.moved) return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
      down.moved = true;
      setHover(null);
      return;
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (world.flying) return setHover(null);
      setHover(pick(e.clientX, e.clientY), e.clientX, e.clientY);
    });
  });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
  });
  canvas.addEventListener('pointerup', (e) => {
    const d = down;
    down = null;
    if (!d || world.flying) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 600) return;
    const t = pick(e.clientX, e.clientY);
    if (!t) return;
    closeMenu();
    if (t.type === 'product') navigate(V.productUrl(t.entry.rayon, t.entry.product));
    else navigate(V.rayonUrl(t.chalet.rayon));
    if (e.pointerType === 'touch') setHover(null);
  });
}

boot();
