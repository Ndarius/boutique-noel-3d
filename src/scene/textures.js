import * as THREE from 'three';

// Textures procédurales (canvas) : aucune image à télécharger.
const cache = new Map();

function canvasTexture(key, w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const id = `${key}:${repeat.join('x')}`;
  if (cache.has(id)) return cache.get(id);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, t);
  return t;
}

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const stripes = (a = '#c8102e', b = '#fbf7f0', repeat = [6, 1]) =>
  canvasTexture(`stripes-${a}-${b}`, 128, 128, (g, w, h) => {
    g.fillStyle = b;
    g.fillRect(0, 0, w, h);
    g.fillStyle = a;
    for (let i = -2; i < 4; i++) {
      g.beginPath();
      g.moveTo(i * 64, 0);
      g.lineTo(i * 64 + 32, 0);
      g.lineTo(i * 64 + 32 + 128, h);
      g.lineTo(i * 64 + 128, h);
      g.closePath();
      g.fill();
    }
  }, { repeat });

export const woodPlanks = (base = '#6b4429', repeat = [3, 1]) =>
  canvasTexture(`planks-${base}`, 256, 256, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const x = (i * w) / n;
      const shade = 0.82 + r() * 0.3;
      g.fillStyle = `rgba(${shade > 1 ? 255 : 0},${shade > 1 ? 230 : 0},${shade > 1 ? 200 : 0},${Math.abs(1 - shade) * 0.5})`;
      g.fillRect(x, 0, w / n, h);
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = `rgba(30,15,5,${0.08 + r() * 0.12})`;
        g.lineWidth = 1;
        g.beginPath();
        const xx = x + r() * (w / n);
        g.moveTo(xx, 0);
        g.bezierCurveTo(xx + r() * 6 - 3, h * 0.3, xx + r() * 6 - 3, h * 0.7, xx + r() * 4 - 2, h);
        g.stroke();
      }
      g.fillStyle = 'rgba(20,10,4,0.55)';
      g.fillRect(x, 0, 2, h);
    }
  }, { repeat });

export const snowGround = () =>
  canvasTexture('snow', 512, 512, (g, w, h) => {
    const r = rng(3);
    g.fillStyle = '#dfe6f0';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i++) {
      const v = 200 + Math.floor(r() * 55);
      g.fillStyle = `rgba(${v},${v + 4},${v + 10},${0.25 + r() * 0.35})`;
      const s = 2 + r() * 10;
      g.beginPath();
      g.arc(r() * w, r() * h, s, 0, Math.PI * 2);
      g.fill();
    }
  }, { repeat: [14, 14] });

export const cobbles = () =>
  canvasTexture('cobbles', 512, 512, (g, w, h) => {
    const r = rng(11);
    g.fillStyle = '#3d3a40';
    g.fillRect(0, 0, w, h);
    const size = 42;
    for (let y = 0; y < h + size; y += size) {
      const off = (y / size) % 2 ? size / 2 : 0;
      for (let x = -size; x < w + size; x += size) {
        const v = 95 + Math.floor(r() * 50);
        g.fillStyle = `rgb(${v},${v - 4},${v + 6})`;
        g.beginPath();
        g.roundRect(x + off + 3, y + 3, size - 6, size - 6, 10);
        g.fill();
        // neige dans les joints
        g.fillStyle = `rgba(235,240,248,${0.25 + r() * 0.4})`;
        g.beginPath();
        g.arc(x + off + r() * size, y + r() * size, 3 + r() * 8, 0, Math.PI * 2);
        g.fill();
      }
    }
  }, { repeat: [5, 5] });

export const pattern = (kind, bg, fg) =>
  canvasTexture(`pat-${kind}-${bg}-${fg}`, 256, 256, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    if (kind === 'dots') {
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          g.beginPath();
          g.arc(x * 32 + (y % 2) * 16 + 8, y * 32 + 16, 6, 0, Math.PI * 2);
          g.fill();
        }
    } else if (kind === 'stars') {
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) drawStar(g, x * 64 + (y % 2) * 32 + 20, y * 64 + 32, 14, 6);
    } else {
      for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, h);
    }
  }, { repeat: [2, 1] });

function drawStar(g, cx, cy, R, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 ? r : R;
    g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  g.closePath();
  g.fill();
}

export const plateTop = () =>
  canvasTexture('plate', 256, 256, (g, w, h) => {
    g.fillStyle = '#fbf8f2';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a24a';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(128, 128, 118, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 2;
    g.beginPath();
    g.arc(128, 128, 104, 0, Math.PI * 2);
    g.stroke();
    // houx
    g.fillStyle = '#1f6b46';
    for (const a of [-0.6, 0.6, 0]) {
      g.save();
      g.translate(128, 120);
      g.rotate(a);
      g.beginPath();
      g.ellipse(0, -26, 12, 28, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.fillStyle = '#c8102e';
    for (const [x, y] of [[120, 126], [136, 126], [128, 138]]) {
      g.beginPath();
      g.arc(x, y, 8, 0, Math.PI * 2);
      g.fill();
    }
  });

export function signTexture({ number, title, accent }) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 200;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 200);
  grd.addColorStop(0, '#1d3b2e');
  grd.addColorStop(1, '#112619');
  g.fillStyle = grd;
  g.fillRect(0, 0, 1024, 200);
  g.strokeStyle = '#e8c27a';
  g.lineWidth = 6;
  g.strokeRect(14, 14, 996, 172);
  g.fillStyle = accent;
  g.beginPath();
  g.arc(110, 100, 58, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff8ea';
  g.font = '700 70px "Playfair Display", Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(number), 110, 104);
  g.fillStyle = '#f6e7c4';
  g.font = '700 70px "Playfair Display", Georgia, serif';
  g.textAlign = 'left';
  let size = 70;
  while (g.measureText(title).width > 820 && size > 40) {
    size -= 2;
    g.font = `700 ${size}px "Playfair Display", Georgia, serif`;
  }
  g.fillText(title, 196, 104);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function softDot() {
  return canvasTexture('dot', 64, 64, (g) => {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  });
}
