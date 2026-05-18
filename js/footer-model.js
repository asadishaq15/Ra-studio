import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gsap = window.gsap;
const canvas = document.getElementById('footerCanvas');
const footer = document.getElementById('footer');
if (!canvas || !footer) throw new Error('Missing footer elements');

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 6;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);
const backLight = new THREE.DirectionalLight(0xaaddff, 1.2);
backLight.position.set(-4, -3, -2);
scene.add(backLight);
scene.add(new THREE.PointLight(0xffffff, 1.5, 20).translateZ(5));

let modelA, modelB;
let played = false;

function resize() {
  const rect = footer.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  camera.aspect = rect.width / rect.height;
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

function playAnimation() {
  if (played || !modelA || !modelB) return;
  played = true;

  gsap.fromTo(modelA.position,
    { x: -7, y: 6, z: 0 },
    { x: -2.8, y: 2.2, z: 0, duration: 6, ease: 'power1.out' }
  );
  gsap.to(modelA.rotation, {
    y: Math.PI * 2, duration: 12, ease: 'none', repeat: -1,
  });

  gsap.fromTo(modelB.position,
    { x: 7, y: -6, z: 0 },
    { x: 2.8, y: -1.8, z: 0, duration: 6, ease: 'power1.out' }
  );
  gsap.to(modelB.rotation, {
    y: -Math.PI * 2, duration: 12, ease: 'none', repeat: -1,
  });
}

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) playAnimation();
}, { threshold: 0.15 });
observer.observe(footer);

const loader = new GLTFLoader();
loader.load('assets/models/sphere_within_box.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) child.material = glassMat.clone();
  });

  const box = new THREE.Box3().setFromObject(model);
  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray());
  model.scale.setScalar(2.2 / maxDim);
  model.updateMatrixWorld(true);
  const c = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  model.position.sub(c);

  const pivotA = new THREE.Group();
  pivotA.add(model);
  pivotA.position.set(-7, 6, 0);
  scene.add(pivotA);
  modelA = pivotA;

  const cloned = model.clone(true);
  const pivotB = new THREE.Group();
  pivotB.add(cloned);
  pivotB.position.set(7, -6, 0);
  scene.add(pivotB);
  modelB = pivotB;
});

let footerTime = 0;
function animate() {
  requestAnimationFrame(animate);
  footerTime += 0.01;
  if (modelA) {
    modelA.rotation.z += 0.002;
    modelA.position.y = 2.2 + Math.sin(footerTime) * 0.15;
    modelA.position.x = -2.8 + Math.cos(footerTime * 0.7) * 0.1;
  }
  if (modelB) {
    modelB.rotation.z -= 0.002;
    modelB.position.y = -1.8 + Math.sin(footerTime + 1) * 0.15;
    modelB.position.x = 2.8 + Math.cos(footerTime * 0.7 + 1) * 0.1;
  }
  renderer.render(scene, camera);
}
animate();
