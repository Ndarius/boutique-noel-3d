import { RAYONS, formatPrice } from '../data/catalog.js';

export const rayonUrl = (r) => `/rayon/${r.slug}`;
export const productUrl = (r, p) => `/rayon/${r.slug}/${p.slug}`;

export const FREE_SHIPPING = 49;

const ico = {
  arrowR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-11"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/></svg>',
};

const img = (thumbs, p) => {
  const src = thumbs.get(p.slug);
  return src ? `<img src="${src}" alt="" loading="lazy" decoding="async" />` : '';
};

export function navLinks(current) {
  return RAYONS.map(
    (r) => `<a href="${rayonUrl(r)}" data-link style="--accent:${r.accent}" ${current === r.slug ? 'aria-current="page"' : ''}>
      <span class="n">${r.number}</span><span class="label">${r.short}</span></a>`,
  ).join('');
}

export function dockDots(current) {
  return RAYONS.map(
    (r) => `<a href="${rayonUrl(r)}" data-link style="--accent:${r.accent}" title="Rayon ${r.number} · ${r.name}" aria-label="Rayon ${r.number} : ${r.name}" ${current === r.slug ? 'aria-current="page"' : ''}></a>`,
  ).join('');
}

function sheetHead(title, sub) {
  return `<button class="panel-head" data-action="toggle-sheet" aria-label="Afficher ou masquer le panneau">
    <span><span class="t">${title}</span><br><span class="s">${sub}</span></span>${ico.chevron}</button>`;
}

export function homePanel() {
  const total = RAYONS.reduce((n, r) => n + r.products.length, 0);
  return `${sheetHead('Plan du marché', `5 rayons · ${total} articles`)}
  <div class="panel-scroll">
    <p class="eyebrow">Bienvenue au marché</p>
    <h1>Toute la décoration de Noël, en 3D</h1>
    <p class="lead">Flânez entre nos cinq chalets, approchez-vous des étagères et choisissez vos décorations comme en boutique.</p>
    <ul class="rayon-list">
      ${RAYONS.map(
        (r) => `<li><a class="rayon-card" href="${rayonUrl(r)}" data-link data-rayon="${r.slug}" style="--accent:${r.accent}">
          <span class="num">${r.number}</span>
          <span><strong>${r.name}</strong><small>Rayon ${r.number} · ${r.products.length} articles</small></span>
          <span class="arrow">${ico.arrowR}</span></a></li>`,
      ).join('')}
    </ul>
    <div class="perks">
      <div class="perk"><strong>Livraison offerte</strong>dès ${FREE_SHIPPING} € d'achat</div>
      <div class="perk"><strong>Avant Noël</strong>commande jusqu'au 20/12</div>
      <div class="perk"><strong>Paiement sécurisé</strong>CB, PayPal</div>
      <div class="perk"><strong>Retours</strong>30 jours pour changer d'avis</div>
    </div>
  </div>`;
}

export function rayonPanel(rayon, thumbs, activeSlug) {
  const i = RAYONS.indexOf(rayon);
  const prev = RAYONS[(i + RAYONS.length - 1) % RAYONS.length];
  const next = RAYONS[(i + 1) % RAYONS.length];
  return `${sheetHead(rayon.name, `Rayon ${rayon.number} sur ${RAYONS.length} · ${rayon.products.length} articles`)}
  <div class="panel-scroll" style="--accent:${rayon.accent}">
    <a href="/" data-link class="back-link">${ico.arrowL} Plan du marché</a>
    <p class="eyebrow">Rayon ${rayon.number} sur ${RAYONS.length}</p>
    <h2>${rayon.name}</h2>
    <p class="lead">${rayon.description}</p>
    <div class="address">
      <div><span class="lbl">Adresse du rayon</span><code>${location.host}${rayonUrl(rayon)}</code></div>
      <button data-action="copy" data-path="${rayonUrl(rayon)}" title="Copier l'adresse" aria-label="Copier l'adresse du rayon">${ico.copy}</button>
    </div>
    <div class="prod-grid">
      ${rayon.products.map(
        (p) => `<a class="prod-card" href="${productUrl(rayon, p)}" data-link data-product="${p.slug}" ${p.slug === activeSlug ? 'aria-current="true"' : ''}>
          ${p.badge ? `<span class="tag">${p.badge}</span>` : ''}
          <span class="thumb">${img(thumbs, p)}</span>
          <span class="name">${p.name}</span>
          <span class="price">${formatPrice(p.price)}</span></a>`,
      ).join('')}
    </div>
    <div class="pager">
      <a href="${rayonUrl(prev)}" data-link>← Rayon ${prev.number}<strong>${prev.short}</strong></a>
      <a href="${rayonUrl(next)}" data-link class="next">Rayon ${next.number} →<strong>${next.short}</strong></a>
    </div>
  </div>`;
}

export function productPanel(rayon, product, thumbs, qty) {
  const i = rayon.products.indexOf(product);
  const prev = rayon.products[(i + rayon.products.length - 1) % rayon.products.length];
  const next = rayon.products[(i + 1) % rayon.products.length];
  return `<a class="icon-btn close" href="${rayonUrl(rayon)}" data-link aria-label="Fermer la fiche">${ico.close}</a>
    <a class="rayon-link" href="${rayonUrl(rayon)}" data-link style="--accent:${rayon.accent}"><span class="dot"></span>Rayon ${rayon.number} · ${rayon.name}</a>
    ${product.badge ? `<span class="tag inline">${product.badge}</span>` : ''}
    <h2>${product.name}</h2>
    <p class="price-big">${formatPrice(product.price)}</p>
    <p class="desc">${product.description}</p>
    <ul class="details">${product.details.map((d) => `<li>${ico.check}<span>${d}</span></li>`).join('')}</ul>
    <div class="buy-row">
      <div class="qty" role="group" aria-label="Quantité">
        <button data-action="qty-dec" aria-label="Diminuer">−</button>
        <output id="qty-value">${qty}</output>
        <button data-action="qty-inc" aria-label="Augmenter">+</button>
      </div>
      <button class="btn btn-gold" data-action="add">${ico.bag} Ajouter au panier</button>
    </div>
    <button class="share" data-action="copy" data-path="${productUrl(rayon, product)}">${ico.link} Copier le lien de ce produit</button>
    <nav class="prod-nav" aria-label="Produits du rayon">
      <a href="${productUrl(rayon, prev)}" data-link>${ico.arrowL} ${prev.name}</a>
      <a href="${productUrl(rayon, next)}" data-link>${next.name} ${ico.arrowR}</a>
    </nav>`;
}

export function cartDrawer(cart, thumbs) {
  const lines = cart.lines();
  const total = cart.total();
  const left = Math.max(0, FREE_SHIPPING - total);
  const items = lines.length
    ? `<ul class="cart-items">${lines
        .map(
          (l) => `<li class="cart-item">
          <span class="thumb">${img(thumbs, l.product)}</span>
          <div><div class="n">${l.product.name}</div><div class="r">${formatPrice(l.product.price)} l'unité</div>
            <div class="qty" role="group" aria-label="Quantité">
              <button data-action="cart-dec" data-rayon="${l.rayon}" data-slug="${l.slug}" aria-label="Diminuer">−</button>
              <output>${l.qty}</output>
              <button data-action="cart-inc" data-rayon="${l.rayon}" data-slug="${l.slug}" aria-label="Augmenter">+</button>
            </div></div>
          <div><div class="p">${formatPrice(l.qty * l.product.price)}</div>
            <button class="rm" data-action="cart-rm" data-rayon="${l.rayon}" data-slug="${l.slug}">Retirer</button></div>
        </li>`,
        )
        .join('')}</ul>`
    : `<div class="cart-items"><div class="cart-empty">${ico.gift}<p>Votre panier est encore vide.<br>Promenez-vous dans les rayons !</p></div></div>`;
  return `<div class="cart-head"><h2>Votre panier</h2>
      <button class="icon-btn" data-action="close-cart" aria-label="Fermer le panier">${ico.close}</button></div>
    ${items}
    <div class="cart-foot">
      <div class="ship">${left > 0 ? `Plus que <strong>${formatPrice(left)}</strong> pour la livraison offerte` : '🎁 Livraison offerte !'}
        <div class="bar"><span style="width:${Math.min(100, (total / FREE_SHIPPING) * 100)}%"></span></div></div>
      <div class="total"><span>Total</span><strong>${formatPrice(total)}</strong></div>
      <button class="btn btn-gold btn-block" data-action="checkout" ${lines.length ? '' : 'disabled'}>Passer commande</button>
    </div>`;
}
