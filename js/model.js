import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const canvas = document.getElementById('modelCanvas');

const texts = [
  document.getElementById('aboutText1'),
  document.getElementById('aboutText2'),
  document.getElementById('aboutText3'),
  document.getElementById('aboutText4'),
  document.getElementById('aboutText5'),
];

const servicesTexts = [
  document.getElementById('servicesText1'),
  document.getElementById('servicesText2'),
  document.getElementById('servicesText3'),
];

function getViewportScale() {
  const w = window.innerWidth;
  if (w <= 480) return 0.52;
  if (w <= 768) return 0.68;
  if (w <= 1024) return 0.88;
  return 1;
}

function maxRendererPixelRatio() {
  return Math.min(window.devicePixelRatio, window.innerWidth <= 768 ? 1.5 : 2);
}

const vScale = getViewportScale();

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(maxRendererPixelRatio());
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.1, 4.8);

scene.add(new THREE.AmbientLight(0xffffff, 1.0));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);

let model = null;
let modelMeshes = [];
let modelFloatAllowed = true;
let baseScale = 1;

function setModelOpacity(opacity) {
  if (!model) return;
  const t = Math.max(0, Math.min(1, opacity));
  model.visible = t > 0.02;
  modelFloatAllowed = t > 0.98;
  modelMeshes.forEach((mesh) => {
    if (!mesh.material) return;
    mesh.material.transparent = true;
    mesh.material.opacity = t;
    mesh.material.depthWrite = t > 0.95;
  });
}

function signalReady() {
  if (window.__introSignalReady) window.__introSignalReady();
}

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load('assets/models/Mutanabi.glb', (gltf) => {

  signalReady();

  model = gltf.scene;

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center);
  baseScale = 3.2 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(baseScale);

  modelMeshes = [];
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.transparent = true;
      child.material.opacity = 1;
      child.material.depthWrite = true;
      modelMeshes.push(child);
    }
  });

  scene.add(model);
  setModelOpacity(1);

  gsap.set(model.position, { x: 8 * vScale, y: -0.5, z: 0 });
  gsap.set(model.rotation, { x: 0, y: 0, z: 0 });
  gsap.set(model.scale, { x: baseScale, y: baseScale, z: baseScale });

  texts.forEach(el => { if (el) gsap.set(el, { opacity: 0 }); });

  const aboutTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#about',
      start: 'top 25%',
      end: 'bottom bottom',
      scrub: true,
      anticipatePin: 1,
    },
    defaults: { ease: 'none' },
  });

  // Phase A: slide in quickly once about section is reached
  aboutTl
    .to(model.position, { x: 1.4 * vScale, y: -0.5, duration: 0.4, ease: 'power2.out' }, 0)
    .to(model.rotation, { y: 0, duration: 0.4, ease: 'power2.out' }, 0)
    .to(model.scale, { x: baseScale, y: baseScale, z: baseScale, duration: 0.4 }, 0)
    .to(texts[0], { opacity: 1, duration: 0.3 }, 0.7)
    .to(texts[0], { opacity: 0, duration: 0.3 }, 1.0);

  // Phase B: 360 rotation — camera rises so head stays in frame
  aboutTl
    .to(model.rotation, { y: Math.PI * 2, duration: 1 }, 1)
    .to(model.position, { x: -1.2 * vScale, y: -0.8, duration: 1 }, 1)
    .to(model.scale, { x: baseScale * 1.5, y: baseScale * 1.5, z: baseScale * 1.5, duration: 1 }, 1)
    .to(camera.position, { y: 2.0, duration: 1 }, 1);

  // Phase C: camera zooms in, model holds position from Phase B
  aboutTl
    .to(camera.position, { y: 2.6, z: 2.8, duration: 1 }, 2)
    .to(model.position, { x: -1.2 * vScale, y: -0.8, duration: 1 }, 2)
    .to(model.rotation, { y: Math.PI * 2 + 0.4, duration: 1 }, 2)
    .to(model.scale, { x: baseScale * 1.5, y: baseScale * 1.5, z: baseScale * 1.5, duration: 1 }, 2)
    .to(texts[1], { opacity: 1, duration: 0.4 }, 2.1);

  ScrollTrigger.refresh();
  renderLoop();
  loadBoomerang();

}, (xhr) => {
  if (xhr.lengthComputable && window.__introSetProgress) {
    window.__introSetProgress((xhr.loaded / xhr.total) * 100);
  }
}, (err) => {
  console.error('Failed to load Mutanabi model:', err);
  signalReady();
  renderLoop();
  loadBoomerang();
});

// ── Boomerang ──────────────────────────────────────────────
let boomerang = null;
let boomFloatGroup = null;
let boomMeshes = [];
let boomBaseScale = 1;
let boomFloatActive = false;
let boomFloatTime = 0;

let handoffTextSnap = null;

function setAboutOverlaysHidden() {
  texts.forEach((el) => {
    if (el) gsap.set(el, { opacity: 0 });
  });
}

window.__raHandoff = {
  setBoomOpacity,
  beginHandoff() {
    handoffTextSnap = servicesTexts.map((el) =>
      el ? Number(gsap.getProperty(el, 'opacity')) : 0
    );
    setAboutOverlaysHidden();
  },
  applyHandoffFade(progress) {
    const p = Math.max(0, Math.min(1, progress));
    const fade = 1 - p;
    if (handoffTextSnap) {
      servicesTexts.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, { opacity: handoffTextSnap[i] * fade });
      });
    }
    setAboutOverlaysHidden();
    setBoomOpacity(fade);
    if (p <= 0) handoffTextSnap = null;
  },
  resetHandoffTexts() {
    handoffTextSnap = null;
    servicesTexts.forEach((el) => {
      if (el) gsap.set(el, { clearProps: 'opacity' });
    });
    setBoomOpacity(1);
  },
};

function setBoomOpacity(opacity) {
  if (!boomerang) return;
  const t = Math.max(0, Math.min(1, opacity));
  boomerang.visible = t > 0.02;
  boomMeshes.forEach((mesh) => {
    if (!mesh.material) return;
    mesh.material.transparent = true;
    mesh.material.opacity = t;
    mesh.material.depthWrite = t > 0.95;
  });
}

// Rest pose: Ra “C” facing camera, slightly tilted downward to match design frame
const BOOM_REST_ROT = { x: -0.52, y: 0.28, z: 0.02 };
const BOOM_HOLD_LEFT = { x: -0.7 * vScale, y: 1.05, z: 0 };
const BOOM_HOLD_RIGHT = { x: 1.9 * vScale, y: 1.05, z: 0 };

const SERVICES_SCRUB_MULT = 0.62;
const BOOM_FLOAT_END = 6.1;

let servicesTimeline = null;
let servicesScrubPxCached = 0;
let servicesResizeTimer = null;

function syncServicesSectionHeight(scrubPx) {
  const el = document.getElementById('services');
  if (!el) return;
  const scrubVh = (scrubPx / window.innerHeight) * 100;
  el.style.height = `${100 + scrubVh}vh`;
}

function refreshServicesScrollMetrics() {
  if (!servicesTimeline) return;
  const scrubPx = Math.round(
    window.innerHeight * servicesTimeline.duration() * SERVICES_SCRUB_MULT
  );
  servicesScrubPxCached = scrubPx;
  const st = ScrollTrigger.getById('servicesScrub');
  if (st) st.vars.end = `+=${scrubPx}`;
  syncServicesSectionHeight(scrubPx);
  ScrollTrigger.refresh();
  window.dispatchEvent(new CustomEvent('servicesScrubReady'));
}

function setBoomFloatActive(timelineTime) {
  boomFloatActive = (timelineTime >= 2.42 && timelineTime < BOOM_FLOAT_END);
}

function loadBoomerang() {
  servicesTexts.forEach(el => { if (el) gsap.set(el, { opacity: 0 }); });

  new GLTFLoader().load('assets/models/ra_final.glb', (gltf) => {
    const boomMesh = gltf.scene;

    boomMeshes = [];
    boomMesh.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.side = THREE.DoubleSide;
        child.material.transparent = true;
        child.material.opacity = 1;
        child.material.depthWrite = true;
        boomMeshes.push(child);
      }
    });

    const box = new THREE.Box3().setFromObject(boomMesh);
    const size = box.getSize(new THREE.Vector3());
    boomBaseScale = 2.4 / Math.max(size.x, size.y, size.z);
    boomMesh.scale.setScalar(boomBaseScale);

    boomMesh.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(boomMesh);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    boomMesh.position.sub(scaledCenter);

    boomFloatGroup = new THREE.Group();
    const boomPivot = new THREE.Group();
    boomFloatGroup.add(boomMesh);
    boomPivot.add(boomFloatGroup);
    boomPivot.visible = false;
    scene.add(boomPivot);
    boomerang = boomPivot;

    gsap.set(boomerang.position, { x: -8 * vScale, y: BOOM_HOLD_LEFT.y, z: 0 });
    gsap.set(boomerang.rotation, BOOM_REST_ROT);

    const servicesTl = gsap.timeline({
      scrollTrigger: {
        id: 'servicesScrub',
        trigger: '#services',
        start: 'top 10%',
        end: () => `+=${Math.round(window.innerHeight * 2.65)}`,
        scrub: true,
        anticipatePin: 1,
        onEnter: () => {
          boomerang.visible = true;
          setBoomOpacity(1);
        },
        onLeaveBack: () => {
          setModelOpacity(1);
        },
        onUpdate: (self) => {
          setBoomFloatActive(self.progress * servicesTl.duration());
        },
      },
      defaults: { ease: 'none' },
      onUpdate: () => {
        setBoomFloatActive(servicesTl.time());
        const hp = window.__handoffProgress || 0;
        if (hp > 0 && window.__raHandoff) {
          window.__raHandoff.applyHandoffFade(hp);
        }
      },
    });

    // Statue fades in place; camera resets after fade starts; boomerang enters
    const statueExit = { opacity: 1 };
    servicesTl
      .to(statueExit, {
        opacity: 0,
        duration: 0.55,
        ease: 'power1.in',
        onUpdate: () => setModelOpacity(statueExit.opacity),
      }, 0)
      .to(texts[1], { opacity: 0, duration: 0.3 }, 0)
      .to(camera.position, { y: 1.1, z: 4.8, duration: 0.55, ease: 'power1.inOut' }, 0.35)
      .to(boomerang.position, { x: BOOM_HOLD_LEFT.x, y: BOOM_HOLD_LEFT.y, duration: 1.8, ease: 'power3.out' }, 0)
      .to(boomerang.rotation, BOOM_REST_ROT, 0)
      .to(servicesTexts[0], { opacity: 1, duration: 0.3 }, 0.6)
      .to(servicesTexts[0], { opacity: 0, duration: 0.3 }, 1.2);

    // Phase 2: slide to right — longer hold on 2nd left paragraph
    servicesTl
      .to(boomerang.position, { x: BOOM_HOLD_RIGHT.x, y: BOOM_HOLD_RIGHT.y, duration: 1 }, 1.5)
      .to(boomerang.rotation, BOOM_REST_ROT, 1.5)
      .to(servicesTexts[1], { opacity: 1, duration: 0.35 }, 3.4)
      .to(servicesTexts[1], { opacity: 0, duration: 0.35 }, 4.6);

    // Phase 3: last paragraph holds full opacity — fade + exit happen in reel handoff
    servicesTl
      .to(servicesTexts[2], { opacity: 1, duration: 0.3 }, 5.1)
      .to({}, { duration: 0.7 }, 5.4);

    servicesTimeline = servicesTl;
    window.__raHandoff.setBoomOpacity = setBoomOpacity;

    refreshServicesScrollMetrics();
  }, undefined, (err) => {
    console.error('Failed to load ra_final model:', err);
  });
}

let floatTime = 0;
function renderLoop() {
  requestAnimationFrame(renderLoop);
  floatTime += 0.008;
  if (model && modelFloatAllowed) {
    model.position.x += Math.sin(floatTime) * 0.001;
    model.position.y += Math.cos(floatTime * 0.7) * 0.0005;
  }

  if (boomFloatGroup && boomFloatActive) {
    boomFloatTime += 0.014;
    const t = boomFloatTime;
    // Subtle drift L/R + tiny vertical bob; almost no spin (keeps Ra letter readable)
    boomFloatGroup.position.set(
      Math.sin(t) * 0.06,
      Math.sin(t * 0.65) * 0.025,
      0
    );
    boomFloatGroup.rotation.set(
      Math.sin(t * 0.5) * 0.006,
      Math.sin(t * 0.4) * 0.01,
      Math.cos(t * 0.45) * 0.006
    );
  } else if (boomFloatGroup) {
    boomFloatGroup.position.set(0, 0, 0);
    boomFloatGroup.rotation.set(0, 0, 0);
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(maxRendererPixelRatio());
  clearTimeout(servicesResizeTimer);
  servicesResizeTimer = setTimeout(refreshServicesScrollMetrics, 150);
});