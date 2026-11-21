import { RAYONS, formatPrice } from '../data/catalog.js';

export const rayonUrl = (r) => `/rayon/${r.slug}`;
export const productUrl = (r, p) => `/rayon/${r.slug}/${p.slug}`;


const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const ico = {
  arrowR: svg('<path d="m9 6 6 6-6 6"/>'),
  arrowL: svg('<path d="m15 6-6 6 6 6"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
  check: svg('<path d="m5 12 5 5 9-11"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  collapse: svg('<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>'),
  chevron: svg('<path d="m6 15 6-6 6 6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  bag: svg('<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
  gift: svg('<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>'),
  truck: svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  tree: svg('<path d="M12 3 7 10h3l-4 6h12l-4-6h3z"/><path d="M12 16v4"/>'),
  back: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  shield: svg('<path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  star: svg('<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'),
};

const img = (thumbs, p) => {
  const src = thumbs.get(p.slug);
  return src ? `<img src="${src}" alt="" decoding="async" />` : '';
};
const thumbBox = (thumbs, p, cls = 'thumb') =>
  `<span class="${cls}${thumbs.has(p.slug) ? '' : ' loading'}">${img(thumbs, p)}</span>`;


// ---------------------------------------------------------------- Navigation
export function navLinks(current) {
  return RAYONS.map(
    (r) => `<a href="${rayonUrl(r)}" data-link style="--accent:${r.accent}" ${current === r.slug ? 'aria-current="page"' : ''}>
      <span class="n">${r.number}</span><span class="label">${r.short}</span></a>`,
  ).join('');
}

export function dockDots(current) {
  return RAYONS.map(
    (r) => `<a href="${rayonUrl(r)}" data-link style="--accent:${r.accent}" title="Chalet ${r.number} · ${r.name}" aria-label="Chalet ${r.number} : ${r.name}" ${current === r.slug ? 'aria-current="page"' : ''}></a>`,
  ).join('');
}

function chips(current) {
  return `<nav class="chips" aria-label="Changer de chalet">
    <a href="/" data-link class="chip chip-home" ${current ? '' : 'aria-current="page"'}>${ico.tree}<span>Village</span></a>
    ${RAYONS.map(
      (r) => `<a href="${rayonUrl(r)}" data-link class="chip" style="--accent:${r.accent}" ${current === r.slug ? 'aria-current="page"' : ''}><i></i>${r.short}</a>`,
    ).join('')}
  </nav>`;
}

function sheetHead(title, sub) {
  return `<button class="panel-toggle" data-action="toggle-sheet" aria-label="Replier le menu" title="Replier le menu">${ico.collapse}</button>
  <button class="panel-head" data-action="toggle-sheet" aria-label="Agrandir ou réduire le panneau">
    <span class="grip" aria-hidden="true"></span>
    <span class="ph-text"><span class="t">${title}</span><span class="s">${sub}</span></span>${ico.chevron}</button>`;
}

// ---------------------------------------------------------------- Cartes produit
export function productCard(rayon, p, thumbs, active) {
  return `<article class="prod-card" data-product="${p.slug}" style="--accent:${rayon.accent}" ${active ? 'aria-current="true"' : ''}>
    <a class="prod-link" href="${productUrl(rayon, p)}" data-link>
      ${p.badge ? `<span class="tag">${p.badge}</span>` : ''}
      ${thumbBox(thumbs, p)}
      <span class="name">${p.name}</span>
      <span class="price">${formatPrice(p.price)}</span>
    </a>
    <button class="quick-add" data-action="quick-add" data-rayon="${rayon.slug}" data-slug="${p.slug}" aria-label="Ajouter « ${p.name} » au panier">${ico.plus}</button>
  </article>`;
}

// ---------------------------------------------------------------- Accueil
export function homePanel(thumbs) {
  const total = RAYONS.reduce((n, r) => n + r.products.length, 0);
  const favs = RAYONS.flatMap((r) => r.products.filter((p) => p.badge === 'Best-seller').map((p) => [r, p])).slice(0, 4);
  return `${sheetHead('Le village', `5 chalets · ${total} trésors de Noël`)}
  <div class="panel-scroll">
    ${chips(null)}
    <p class="eyebrow">Le village est réveillé</p>
    <h1>Cinq chalets.<br>Un Noël à composer.</h1>
    <p class="lead">Chaque chalet garde une partie de la magie. Entrez, approchez-vous des étagères et emportez ce qui fera briller votre maison.</p>
    <ul class="rayon-list">
      ${RAYONS.map(
        (r) => `<li><a class="rayon-card" href="${rayonUrl(r)}" data-link data-rayon="${r.slug}" style="--accent:${r.accent}">
          <span class="num">${r.number}</span>
          <span class="rc-text"><strong>${r.name}</strong><small>${r.products.length} trésors · dès ${formatPrice(Math.min(...r.products.map((p) => p.price)))}</small></span>
          <span class="minis">${r.products.slice(0, 3).map((p) => thumbBox(thumbs, p, 'mini')).join('')}</span>
          <span class="arrow">${ico.arrowR}</span></a></li>`,
      ).join('')}
    </ul>
    <h3 class="section-title">${ico.star} Les coups de cœur du village</h3>
    <div class="prod-grid">${favs.map(([r, p]) => productCard(r, p, thumbs)).join('')}</div>
  </div>`;
}

// ---------------------------------------------------------------- Chalet
export function rayonPanel(rayon, thumbs, activeSlug) {
  const i = RAYONS.indexOf(rayon);
  const prev = RAYONS[(i + RAYONS.length - 1) % RAYONS.length];
  const next = RAYONS[(i + 1) % RAYONS.length];
  return `${sheetHead(rayon.name, `Chalet ${rayon.number} · ${rayon.products.length} trésors · dès ${formatPrice(Math.min(...rayon.products.map((p) => p.price)))}`)}
  <div class="panel-scroll" style="--accent:${rayon.accent}">
    ${chips(rayon.slug)}
    <a href="/" data-link class="back-link">${ico.arrowL} Retour au village</a>
    <p class="eyebrow">Chalet ${rayon.number} sur ${RAYONS.length}</p>
    <h2>${rayon.name}</h2>
    <p class="lead">${rayon.description}</p>
    <div class="prod-grid">
      ${rayon.products.map((p) => productCard(rayon, p, thumbs, p.slug === activeSlug)).join('')}
    </div>
    <button class="share-chalet" data-action="copy" data-path="${rayonUrl(rayon)}">${ico.share} Partager ce chalet</button>
    <div class="pager">
      <a href="${rayonUrl(prev)}" data-link>← Chalet ${prev.number}<strong>${prev.short}</strong></a>
      <a href="${rayonUrl(next)}" data-link class="next">Chalet ${next.number} →<strong>${next.short}</strong></a>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- Fiche produit
export function productPanel(rayon, product, thumbs, qty) {
  const i = rayon.products.indexOf(product);
  const prev = rayon.products[(i + rayon.products.length - 1) % rayon.products.length];
  const next = rayon.products[(i + 1) % rayon.products.length];
  const others = rayon.products.filter((p) => p !== product).slice(0, 4);
  return `<div class="pp-scroll">
    <a class="icon-btn close" href="${rayonUrl(rayon)}" data-link aria-label="Fermer la fiche">${ico.close}</a>
    <span class="pp-grip" aria-hidden="true"></span>
    <a class="rayon-link" href="${rayonUrl(rayon)}" data-link><span class="dot"></span>${rayon.name}</a>
    <div class="pp-head">
      ${thumbBox(thumbs, product, 'pp-thumb')}
      <div>
        ${product.badge ? `<span class="tag inline">${product.badge}</span>` : ''}
        <h2>${product.name}</h2>
        <p class="price-big">${formatPrice(product.price)} <small>TTC</small></p>
      </div>
    </div>
    <p class="desc">${product.description}</p>
    <ul class="details">${product.details.map((d) => `<li>${ico.check}<span>${d}</span></li>`).join('')}</ul>
    <h3 class="section-title">Dans le même chalet</h3>
    <div class="also">${others.map((p) => `<a href="${productUrl(rayon, p)}" data-link class="also-card">${thumbBox(thumbs, p)}<span class="name">${p.name}</span><span class="price">${formatPrice(p.price)}</span></a>`).join('')}</div>
    <nav class="prod-nav" aria-label="Produits du chalet">
      <a href="${productUrl(rayon, prev)}" data-link>${ico.arrowL} Précédent</a>
      <button class="share" data-action="copy" data-path="${productUrl(rayon, product)}">${ico.share} Partager</button>
      <a href="${productUrl(rayon, next)}" data-link>Suivant ${ico.arrowR}</a>
    </nav>
  </div>
  <div class="buy-bar">
    <div class="qty" role="group" aria-label="Quantité">
      <button data-action="qty-dec" aria-label="Diminuer">−</button>
      <output id="qty-value">${qty}</output>
      <button data-action="qty-inc" aria-label="Augmenter">+</button>
    </div>
    ${product.lien
      ? `<a class="btn btn-gold" href="${product.lien}" target="_blank" rel="noopener">${ico.bag}<span>Acheter · <b id="buy-total">${formatPrice(qty * product.price)}</b></span></a>`
      : `<button class="btn btn-gold" data-action="add">${ico.bag}<span>Ajouter · <b id="buy-total">${formatPrice(qty * product.price)}</b></span></button>`}
  </div>`;
}

// ---------------------------------------------------------------- Panier & commande
function cartHead(title) {
  return `<div class="cart-head">
    <h2>${title}</h2>
    <button class="icon-btn" data-action="close-cart" aria-label="Fermer le panier">${ico.close}</button></div>`;
}

export function cartDrawer(cart, thumbs) {
  const lines = cart.lines();
  const total = cart.total();
  const count = cart.count();
  const items = lines.length
    ? `<ul class="cart-items">${lines
        .map(
          (l) => `<li class="cart-item">
          <span class="thumb">${img(thumbs, l.product)}</span>
          <div class="ci-main"><div class="n">${l.product.name}</div><div class="r">${formatPrice(l.product.price)} l’unité</div>
            <div class="qty" role="group" aria-label="Quantité">
              <button data-action="cart-dec" data-rayon="${l.rayon}" data-slug="${l.slug}" aria-label="Diminuer">−</button>
              <output>${l.qty}</output>
              <button data-action="cart-inc" data-rayon="${l.rayon}" data-slug="${l.slug}" aria-label="Augmenter">+</button>
            </div></div>
          <div class="ci-side"><div class="p">${formatPrice(l.qty * l.product.price)}</div>
            <button class="rm" data-action="cart-rm" data-rayon="${l.rayon}" data-slug="${l.slug}">Retirer</button></div>
        </li>`,
        )
        .join('')}</ul>`
    : `<div class="cart-items"><div class="cart-empty">${ico.gift}<p><strong>Votre panier attend ses premiers trésors.</strong><br>Les coups de cœur du village sont à un geste.</p>
        <button class="btn btn-ghost" data-action="close-cart" data-go="/">Découvrir le village</button></div></div>`;
  return `${cartHead(`Votre panier${count ? ` <small>(${count})</small>` : ''}`)}
    ${items}
    <div class="cart-foot">
      <div class="total"><span>Total</span><strong>${formatPrice(total)}</strong></div>
      <button class="btn btn-gold btn-block" data-action="checkout" ${lines.length ? '' : 'disabled'}>Commander ${ico.arrowR}</button>
    </div>`;
}
