import * as THREE from 'three';

// Fabrique une vignette (PNG transparent) pour chaque produit, avec le MÊME moteur 3D
// que la scène : un seul contexte WebGL, ce qui évite que certains téléphones
// coupent la 3D (écran blanc). Deux vignettes par image, dessinées dans un coin du
// canevas juste avant que la scène ne le recouvre entièrement.
export function renderThumbnails(world, entries, { perFrame = 2, size = 168 } = {}) {
  const { renderer } = world;
  const scene = new THREE.Scene();
  scene.environment = world.scene.environment;
  scene.environmentIntensity = 0.85;
  scene.add(new THREE.HemisphereLight('#ffffff', '#6a5040', 0.9));
  const key = new THREE.DirectionalLight('#fff2dc', 2.2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#9fb8ff', 1.2);
  rim.position.set(-3, 2, -3);
  scene.add(rim);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);

  const out = new Map();
  const queue = [...entries];
  const pr = renderer.getPixelRatio();
  const dev = Math.round(size * pr);
  const canvas2d = document.createElement('canvas');
  canvas2d.width = canvas2d.height = Math.min(dev, 320);
  const ctx = canvas2d.getContext('2d');
  const full = new THREE.Vector2();
  const prevClear = new THREE.Color();

  return new Promise((resolve) => {
    world.addUpdater(function step() {
      if (!queue.length) return;
      renderer.getSize(full);
      renderer.getClearColor(prevClear);
      const prevAlpha = renderer.getClearAlpha();
      renderer.setRenderTarget(null);
      renderer.setViewport(0, 0, size, size);
      renderer.setScissor(0, 0, size, size);
      renderer.setScissorTest(true);
      renderer.setClearColor(0x000000, 0);

      for (let n = 0; n < perFrame && queue.length; n++) {
        const e = queue.shift();
        const obj = e.object.clone();
        obj.position.set(0, 0, 0);
        obj.rotation.set(0, -0.35, 0);
        obj.scale.setScalar(1);
        scene.add(obj);
        const sphere = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
        const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 0.92;
        camera.position.copy(sphere.center).add(new THREE.Vector3(0, 0.32, 1).normalize().multiplyScalar(dist));
        camera.lookAt(sphere.center);
        renderer.clear();
        renderer.render(scene, camera);
        // lecture immédiate (même tâche) du coin bas-gauche du canevas WebGL
        const h = renderer.domElement.height;
        ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
        ctx.drawImage(renderer.domElement, 0, h - dev, dev, dev, 0, 0, canvas2d.width, canvas2d.height);
        out.set(e.product.slug, canvas2d.toDataURL('image/png'));
        scene.remove(obj);
      }

      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, full.x, full.y);
      renderer.setClearColor(prevClear, prevAlpha);
      if (!queue.length) resolve(out);
    });
  });
}
