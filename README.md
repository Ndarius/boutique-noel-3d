# Atelier Noël — boutique 3D de décorations de Noël

Un marché de Noël en 3D (Three.js + Vite) : 5 chalets = 5 rayons, chacun avec **sa propre adresse**.

| Rayon | Adresse |
|---|---|
| 1. Sapins & Couronnes | `/rayon/sapins-couronnes` |
| 2. Boules & Suspensions | `/rayon/boules-suspensions` |
| 3. Lumières & Bougies | `/rayon/lumieres-bougies` |
| 4. Crèches & Figurines | `/rayon/creches-figurines` |
| 5. Cadeaux & Art de la table | `/rayon/cadeaux-table` |

Chaque produit a aussi son adresse : `/rayon/<rayon>/<produit>` (ex. `/rayon/boules-suspensions/boule-doree`).

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Mettre en ligne

```bash
npm run build
```

Le dossier `dist/` est le site final.
- **Netlify** : glisser-déposer `dist/` sur app.netlify.com/drop (le fichier `_redirects` fait fonctionner les adresses des rayons).
- **Vercel** : importer le projet ; `vercel.json` gère les adresses.

## Liens Amazon (affiliation)

Tout se règle dans `src/data/catalog.js` :

1. **Votre identifiant Partenaires** : dans `AMAZON`, mettez `tag: 'votre-id-21'`.
   Tant qu'un produit n'a pas son propre lien, le bouton « Voir sur Amazon » ouvre une
   recherche Amazon du produit avec votre identifiant.
2. **Le lien précis d'un produit** : ajoutez `lien: 'https://amzn.to/…'` au produit.
3. **Les prix** : masqués par défaut (`showPrices: false`), car le règlement Amazon
   Partenaires interdit les prix fixes non mis à jour.

Les visiteurs peuvent garder leurs idées dans « Ma liste de Noël » (bouton cœur), puis
les ouvrir sur Amazon. La mention obligatoire « Partenaire Amazon » est affichée.

## Modifier la boutique

- **Produits, prix, textes, rayons** : `src/data/catalog.js`
- **Modèles 3D des produits** : `src/scene/models.js` (générés en code)
- **Décor (chalets, sapin géant, neige, forêt)** : `src/scene/world.js`
- **Musique** : `src/audio/music.js` — Jingle Bells & Douce Nuit (domaine public), synthétisés en direct
- **Style de l'interface** : `src/style.css`

## Navigation

- Clic sur un chalet → entrer dans le rayon ; clic sur un produit → fiche produit
- Glisser = tourner la caméra, molette = zoom
- Clavier : ← / → rayon (ou produit) précédent/suivant, Échap = revenir, M = musique

Note : le paiement n'est pas branché (bouton « Passer commande » de démonstration).
