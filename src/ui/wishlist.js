import { findProduct, findRayon } from '../data/catalog.js';

const KEY = 'msdn-liste-de-noel';

// « Ma liste de Noël » : les idées mises de côté, gardées dans le navigateur du visiteur.
export function createWishlist() {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem(KEY) || '[]').filter((i) => findProduct(i.rayon, i.slug));
  } catch {
    items = [];
  }
  const listeners = new Set();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* navigation privée : la liste reste en mémoire */
    }
    listeners.forEach((fn) => fn());
  };
  const has = (rayon, slug) => items.some((i) => i.rayon === rayon && i.slug === slug);
  return {
    onChange: (fn) => listeners.add(fn),
    has,
    count: () => items.length,
    lines: () => items.map((i) => ({ ...i, product: findProduct(i.rayon, i.slug), rayonObj: findRayon(i.rayon) })),
    toggle(rayon, slug) {
      const on = !has(rayon, slug);
      items = on ? [...items, { rayon, slug }] : items.filter((i) => !(i.rayon === rayon && i.slug === slug));
      save();
      return on;
    },
    remove(rayon, slug) {
      items = items.filter((i) => !(i.rayon === rayon && i.slug === slug));
      save();
    },
  };
}
