import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('footerCanvas');
const footer = document.getElementById('footer');
if (!canvas || !footer) throw new Error('Missing footer elements');

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 768 ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 6.8;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);
const backLight = new THREE.DirectionalLight(0xaaddff, 1.2);
backLight.position.set(-4, -3, -2);
scene.add(backLight);
scene.add(new THREE.PointLight(0xffffff, 1.5, 20).translateZ(5));

let modelA, modelB;
let footerVisible = false;
let entryProgress = 0;

function resize() {
  const rect = footer.getBoundingClientRect();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 768 ? 1.5 : 2));
  renderer.setSize(rect.width, rect.height);
  camera.aspect = rect.width / rect.height;
  camera.position.z = window.innerWidth <= 768 ? 8.2 : 6.8;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.0,
  transmission: 0.98,
  thickness: 2.0,
  ior: 2.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.0,
  reflectivity: 1.0,
  envMapIntensity: 2.0,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6,
  attenuationColor: new THREE.Color(0x88ccff),
  attenuationDistance: 0.5,
});

const observer = new IntersectionObserver((entries) => {
  footerVisible = entries[0].isIntersecting;
}, { threshold: 0.15 });
observer.observe(footer);

function footerLayout() {
  const w = window.innerWidth;
  if (w <= 480) {
    return {
      top: new THREE.Vector3(-1.45, 1.65, 0),
      bottom: new THREE.Vector3(1.45, -1.55, 0),
      entranceTop: new THREE.Vector3(-4.5, 4.2, 0),
      entranceBottom: new THREE.Vector3(4.5, -4.2, 0),
    };
  }
  if (w <= 768) {
    return {
      top: new THREE.Vector3(-1.9, 1.75, 0),
      bottom: new THREE.Vector3(1.9, -1.65, 0),
      entranceTop: new THREE.Vector3(-5, 4.6, 0),
      entranceBottom: new THREE.Vector3(5, -4.6, 0),
    };
  }
  return {
    top: new THREE.Vector3(-2.8, 2.0, 0),
    bottom: new THREE.Vector3(2.8, -1.75, 0),
    entranceTop: new THREE.Vector3(-6.2, 4.7, 0),
    entranceBottom: new THREE.Vector3(6.2, -4.7, 0),
  };
}

const loader = new GLTFLoader();
loader.load('assets/models/sphere_within_box.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) child.material = glassMat.clone();
  });

  const box = new THREE.Box3().setFromObject(model);
  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray());
  const modelScale = 2.05 / maxDim;
  model.scale.setScalar(modelScale);
  model.updateMatrixWorld(true);
  const c = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  model.position.sub(c);

  const pivotA = new THREE.Group();
  pivotA.add(model);
  pivotA.position.copy(footerLayout().entranceTop);
  scene.add(pivotA);
  modelA = pivotA;

  const cloned = model.clone(true);
  const pivotB = new THREE.Group();
  pivotB.add(cloned);
  pivotB.position.copy(footerLayout().entranceBottom);
  scene.add(pivotB);
  modelB = pivotB;
});

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now() * 0.001;
  entryProgress += footerVisible ? 0.012 : -0.006;
  entryProgress = THREE.MathUtils.clamp(entryProgress, 0, 1);
  const entry = easeOutCubic(entryProgress);
  const layout = footerLayout();

  if (modelA) {
    tempA.lerpVectors(layout.entranceTop, layout.top, entry);
    tempA.x += Math.sin(now * 0.55) * 0.12;
    tempA.y += Math.cos(now * 0.45) * 0.12;
    modelA.position.copy(tempA);
    modelA.rotation.set(
      Math.sin(now * 0.35) * 0.12,
      now * 0.22,
      Math.cos(now * 0.28) * 0.08
    );
  }
  if (modelB) {
    tempB.lerpVectors(layout.entranceBottom, layout.bottom, entry);
    tempB.x += Math.cos(now * 0.5 + 1.2) * 0.12;
    tempB.y += Math.sin(now * 0.42 + 1.2) * 0.12;
    modelB.position.copy(tempB);
    modelB.rotation.set(
      Math.cos(now * 0.3) * 0.1,
      -now * 0.2,
      Math.sin(now * 0.32) * 0.08
    );
  }
  renderer.render(scene, camera);
}
animate();
