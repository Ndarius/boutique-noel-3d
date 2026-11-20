import { findProduct } from '../data/catalog.js';

const KEY = 'atelier-noel-panier';

// Panier conservé dans le navigateur du visiteur (localStorage)
export function createCart() {
  let lines = [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    lines = raw.filter((l) => findProduct(l.rayon, l.slug) && l.qty > 0);
  } catch {
    lines = [];
  }
  const listeners = new Set();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* stockage indisponible (navigation privée) : le panier reste en mémoire */
    }
    listeners.forEach((fn) => fn());
  };
  const find = (rayon, slug) => lines.find((l) => l.rayon === rayon && l.slug === slug);

  return {
    onChange: (fn) => listeners.add(fn),
    lines: () =>
      lines.map((l) => ({ ...l, product: findProduct(l.rayon, l.slug) })),
    add(rayon, slug, qty = 1) {
      const l = find(rayon, slug);
      if (l) l.qty = Math.min(99, l.qty + qty);
      else lines.push({ rayon, slug, qty });
      save();
    },
    setQty(rayon, slug, qty) {
      const l = find(rayon, slug);
      if (!l) return;
      l.qty = Math.max(0, Math.min(99, qty));
      if (!l.qty) lines = lines.filter((x) => x !== l);
      save();
    },
    remove(rayon, slug) {
      lines = lines.filter((l) => !(l.rayon === rayon && l.slug === slug));
      save();
    },
    clear() {
      lines = [];
      save();
    },
    count: () => lines.reduce((n, l) => n + l.qty, 0),
    total: () => lines.reduce((n, l) => n + l.qty * findProduct(l.rayon, l.slug).price, 0),
  };
}
