import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Génère une vignette (PNG transparent) pour chaque produit, à partir de son modèle 3D.
export async function renderThumbnails(entries, size = 256) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  scene.add(new THREE.HemisphereLight('#ffffff', '#6a5040', 0.9));
  const key = new THREE.DirectionalLight('#fff2dc', 2.2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#9fb8ff', 1.2);
  rim.position.set(-3, 2, -3);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
  const out = new Map();
  for (const e of entries) {
    const obj = e.object.clone();
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, -0.35, 0);
    obj.scale.setScalar(1);
    scene.add(obj);
    const box = new THREE.Box3().setFromObject(obj);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.92;
    const dir = new THREE.Vector3(0, 0.32, 1).normalize();
    camera.position.copy(sphere.center).add(dir.multiplyScalar(dist));
    camera.lookAt(sphere.center);
    renderer.render(scene, camera);
    out.set(e.product.slug, renderer.domElement.toDataURL('image/png'));
    scene.remove(obj);
    // laisse respirer le navigateur pour animer l'écran de chargement
    await new Promise((r) => setTimeout(r, 0));
  }
  pmrem.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
