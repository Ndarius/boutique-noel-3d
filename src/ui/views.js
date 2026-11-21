import { RAYONS, AMAZON, amazonUrl, formatPrice } from '../data/catalog.js';

export const rayonUrl = (r) => `/rayon/${r.slug}`;
export const productUrl = (r, p) => `/rayon/${r.slug}/${p.slug}`;

const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const ico = {
  arrowR: svg('<path d="m9 6 6 6-6 6"/>'),
  arrowL: svg('<path d="m15 6-6 6 6 6"/>'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
  check: svg('<path d="m5 12 5 5 9-11"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  collapse: svg('<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>'),
  chevron: svg('<path d="m6 15 6-6 6 6"/>'),
  heart: svg('<path d="M12 20s-7-4.4-9-8.6C1.6 8.4 3.4 5 6.6 5c2 0 3.4 1.1 4.4 2.6h2C14 6.1 15.4 5 17.4 5c3.2 0 5 3.4 3.6 6.4C19 15.6 12 20 12 20z"/>'),
  external: svg('<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  gift: svg('<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>'),
  tree: svg('<path d="M12 3 7 10h3l-4 6h12l-4-6h3z"/><path d="M12 16v4"/>'),
  star: svg('<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'),
};

const priceTag = (p, cls = 'price') => (AMAZON.showPrices ? `<span class="${cls}">${formatPrice(p.price)}</span>` : '');
const amazonAttrs = (p) => `href="${amazonUrl(p)}" target="_blank" rel="sponsored noopener noreferrer"`;

const img = (thumbs, p) => {
  const src = thumbs.get(p.slug);
  return src ? `<img src="${src}" alt="" decoding="async" />` : '';
};
const thumbBox = (thumbs, p, cls = 'thumb') =>
  `<span class="${cls}${thumbs.has(p.slug) ? '' : ' loading'}">${img(thumbs, p)}</span>`;

const disclosure = () => `<p class="disclosure">Liens partenaires · ${AMAZON.disclosure}</p>`;

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
// Toucher la carte ouvre la fiche (produit en 3D) ; « Amazon » ouvre le produit sur Amazon ;
// le cœur garde l'idée dans « Ma liste de Noël ».
export function productCard(rayon, p, thumbs, wish, active) {
  const saved = wish.has(rayon.slug, p.slug);
  return `<article class="prod-card" data-product="${p.slug}" style="--accent:${rayon.accent}" ${active ? 'aria-current="true"' : ''}>
    <a class="prod-link" href="${productUrl(rayon, p)}" data-link>
      ${p.badge ? `<span class="tag">${p.badge}</span>` : ''}
      ${thumbBox(thumbs, p)}
      <span class="name">${p.name}</span>
      ${priceTag(p)}
    </a>
    <a class="card-amazon" ${amazonAttrs(p)} aria-label="Voir « ${p.name} » sur Amazon">Voir sur Amazon ${ico.external}</a>
    <button class="wish ${saved ? 'on' : ''}" data-action="wish" data-rayon="${rayon.slug}" data-slug="${p.slug}" aria-pressed="${saved}" aria-label="${saved ? 'Retirer de' : 'Ajouter à'} ma liste de Noël">${ico.heart}</button>
  </article>`;
}

// ---------------------------------------------------------------- Accueil
export function homePanel(thumbs, wish) {
  const total = RAYONS.reduce((n, r) => n + r.products.length, 0);
  const favs = RAYONS.flatMap((r) => r.products.filter((p) => p.badge === 'Best-seller').map((p) => [r, p])).slice(0, 4);
  return `${sheetHead('Le village', `5 chalets · ${total} idées déco de Noël`)}
  <div class="panel-scroll">
    ${chips(null)}
    <p class="eyebrow">Le village est réveillé</p>
    <h1>Cinq chalets.<br>Un Noël à composer.</h1>
    <p class="lead">Chaque chalet garde une partie de la magie. Entrez, approchez-vous des étagères et gardez vos coups de cœur dans votre liste de Noël.</p>
    <ul class="rayon-list">
      ${RAYONS.map(
        (r) => `<li><a class="rayon-card" href="${rayonUrl(r)}" data-link data-rayon="${r.slug}" style="--accent:${r.accent}">
          <span class="num">${r.number}</span>
          <span class="rc-text"><strong>${r.name}</strong><small>${r.products.length} idées${AMAZON.showPrices ? ` · dès ${formatPrice(Math.min(...r.products.map((p) => p.price)))}` : ''}</small></span>
          <span class="minis">${r.products.slice(0, 3).map((p) => thumbBox(thumbs, p, 'mini')).join('')}</span>
          <span class="arrow">${ico.arrowR}</span></a></li>`,
      ).join('')}
    </ul>
    <h3 class="section-title">${ico.star} Les coups de cœur du village</h3>
    <div class="prod-grid">${favs.map(([r, p]) => productCard(r, p, thumbs, wish)).join('')}</div>
    ${disclosure()}
  </div>`;
}

// ---------------------------------------------------------------- Chalet
export function rayonPanel(rayon, thumbs, wish, activeSlug) {
  const i = RAYONS.indexOf(rayon);
  const prev = RAYONS[(i + RAYONS.length - 1) % RAYONS.length];
  const next = RAYONS[(i + 1) % RAYONS.length];
  return `${sheetHead(rayon.name, `Chalet ${rayon.number} sur ${RAYONS.length} · ${rayon.products.length} idées`)}
  <div class="panel-scroll" style="--accent:${rayon.accent}">
    ${chips(rayon.slug)}
    <a href="/" data-link class="back-link">${ico.arrowL} Retour au village</a>
    <p class="eyebrow">Chalet ${rayon.number} sur ${RAYONS.length}</p>
    <h2>${rayon.name}</h2>
    <p class="lead">${rayon.description}</p>
    <div class="prod-grid">
      ${rayon.products.map((p) => productCard(rayon, p, thumbs, wish, p.slug === activeSlug)).join('')}
    </div>
    <button class="share-chalet" data-action="copy" data-path="${rayonUrl(rayon)}">${ico.share} Partager ce chalet</button>
    <div class="pager">
      <a href="${rayonUrl(prev)}" data-link>← Chalet ${prev.number}<strong>${prev.short}</strong></a>
      <a href="${rayonUrl(next)}" data-link class="next">Chalet ${next.number} →<strong>${next.short}</strong></a>
    </div>
    ${disclosure()}
  </div>`;
}

// ---------------------------------------------------------------- Fiche produit
export function productPanel(rayon, product, thumbs, wish) {
  const i = rayon.products.indexOf(product);
  const prev = rayon.products[(i + rayon.products.length - 1) % rayon.products.length];
  const next = rayon.products[(i + 1) % rayon.products.length];
  const others = rayon.products.filter((p) => p !== product).slice(0, 4);
  const saved = wish.has(rayon.slug, product.slug);
  return `<div class="pp-scroll">
    <a class="icon-btn close" href="${rayonUrl(rayon)}" data-link aria-label="Fermer la fiche">${ico.close}</a>
    <span class="pp-grip" aria-hidden="true"></span>
    <a class="rayon-link" href="${rayonUrl(rayon)}" data-link><span class="dot"></span>${rayon.name}</a>
    <div class="pp-head">
      ${thumbBox(thumbs, product, 'pp-thumb')}
      <div>
        ${product.badge ? `<span class="tag inline">${product.badge}</span>` : ''}
        <h2>${product.name}</h2>
        ${priceTag(product, 'price-big')}
      </div>
    </div>
    <p class="desc">${product.description}</p>
    <ul class="details">${product.details.map((d) => `<li>${ico.check}<span>${d}</span></li>`).join('')}</ul>
    <h3 class="section-title">Dans le même chalet</h3>
    <div class="also">${others.map((p) => `<a href="${productUrl(rayon, p)}" data-link class="also-card">${thumbBox(thumbs, p)}<span class="name">${p.name}</span>${priceTag(p)}</a>`).join('')}</div>
    <nav class="prod-nav" aria-label="Produits du chalet">
      <a href="${productUrl(rayon, prev)}" data-link>${ico.arrowL} Précédent</a>
      <button class="share" data-action="copy" data-path="${productUrl(rayon, product)}">${ico.share} Partager</button>
      <a href="${productUrl(rayon, next)}" data-link>Suivant ${ico.arrowR}</a>
    </nav>
    ${disclosure()}
  </div>
  <div class="buy-bar">
    <button class="wish-big ${saved ? 'on' : ''}" data-action="wish" data-rayon="${rayon.slug}" data-slug="${product.slug}" aria-pressed="${saved}" aria-label="${saved ? 'Retirer de' : 'Ajouter à'} ma liste de Noël">${ico.heart}</button>
    <a class="btn btn-gold btn-amazon" ${amazonAttrs(product)}>Voir sur Amazon ${ico.external}</a>
  </div>`;
}

// ---------------------------------------------------------------- Ma liste de Noël
export function wishDrawer(wish, thumbs) {
  const lines = wish.lines();
  const body = lines.length
    ? `<ul class="cart-items">${lines
        .map(
          (l) => `<li class="cart-item wish-item" style="--accent:${l.rayonObj.accent}">
          <a class="thumb" href="${productUrl(l.rayonObj, l.product)}" data-link aria-label="Voir la fiche de ${l.product.name}">${img(thumbs, l.product)}</a>
          <div class="ci-main"><a class="n" href="${productUrl(l.rayonObj, l.product)}" data-link>${l.product.name}</a>
            <div class="r"><span class="dot"></span>${l.rayonObj.name}</div>
            <a class="wl-amazon" ${amazonAttrs(l.product)}>Voir sur Amazon ${ico.external}</a></div>
          <button class="rm-x" data-action="wish-rm" data-rayon="${l.rayon}" data-slug="${l.slug}" aria-label="Retirer ${l.product.name} de ma liste">${ico.close}</button>
        </li>`,
        )
        .join('')}</ul>`
    : `<div class="cart-items"><div class="cart-empty">${ico.heart}<p><strong>Votre liste de Noël est vide.</strong><br>Touchez le cœur d’une décoration pour la garder ici, puis retrouvez-la sur Amazon quand vous voulez.</p>
        <button class="btn btn-ghost" data-action="close-cart" data-go="/">Découvrir le village</button></div></div>`;
  return `<div class="cart-head"><h2>Ma liste de Noël${lines.length ? ` <small>(${lines.length})</small>` : ''}</h2>
      <button class="icon-btn" data-action="close-cart" aria-label="Fermer ma liste">${ico.close}</button></div>
    ${body}
    <div class="cart-foot">
      ${lines.length ? `<button class="btn btn-ghost btn-block" data-action="share-list">${ico.share} Partager ma liste</button>` : ''}
      ${disclosure()}
    </div>`;
}
