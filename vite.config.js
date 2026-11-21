import { defineConfig } from 'vite';
import { RAYONS, amazonUrl } from './src/data/catalog.js';

// Liste HTML simple des 30 idées, insérée dans <noscript> : le site reste utilisable
// (et lisible par les moteurs de recherche) sans JavaScript ni 3D.
function listeSans3D() {
  return {
    name: 'liste-sans-3d',
    transformIndexHtml(html) {
      const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const list = RAYONS.map(
        (r) => `<h2>${esc(r.name)}</h2><ul>${r.products
          .map((p) => `<li><a href="${esc(amazonUrl(p))}" rel="sponsored noopener noreferrer" target="_blank">${esc(p.name)}</a> — ${esc(p.description)}</li>`)
          .join('')}</ul>`,
      ).join('');
      return html.replace('<!--LISTE-SANS-3D-->', `<div class="noscript-list"><h1>Mon Sapin de Noël</h1><p>Toutes nos idées de décoration de Noël :</p>${list}<p><small>Liens partenaires Amazon.</small></p></div>`);
    },
  };
}

export default defineConfig({ plugins: [listeSans3D()] });
