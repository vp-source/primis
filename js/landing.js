/* Primis — Landing
   Reveal-on-scroll for slides, and a tiny Three.js scene per world card
   so the gallery feels alive without breaking the calm of the page. */

import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

/* ----------- Reveal slides as they enter viewport ----------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }
  }
}, { rootMargin: "0px 0px -12% 0px", threshold: 0.06 });

document.querySelectorAll(".slide").forEach((el) => io.observe(el));

/* ----------- Tiny world-card 3D previews ----------- */

/* Color palettes per world — chosen to harmonize with the off-white page. */
const WORLD_PALETTES = {
  atrium: { bg: 0xe7e6e2, fg: 0x3a3a3f, accent: 0xb9a98a },
  loft:   { bg: 0xd9d9dc, fg: 0x33343a, accent: 0x8d8a98 },
  forest: { bg: 0xd9dfd6, fg: 0x2e3a30, accent: 0x6b7a64 },
  street: { bg: 0xe3dbd2, fg: 0x3c2f24, accent: 0xa78562 },
};

/* Procedural "scene" per world — a cluster of meshes that hints at the
   decomposed nature of Primis output. Deliberately abstract, not literal. */
function buildSceneFor(name, scene, palette) {
  const mat = (color, metal = 0.0, rough = 0.7) =>
    new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });

  const group = new THREE.Group();

  if (name === "atrium") {
    // columns + floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 8), mat(palette.fg, 0.1, 0.85));
    floor.position.y = -0.6;
    group.add(floor);
    for (let i = -1; i <= 1; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 24), mat(0xece9e1, 0.05, 0.5));
      col.position.set(i * 1.4, 0.5, -1);
      group.add(col);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 16, 80, Math.PI), mat(0xece9e1, 0.05, 0.5));
    arch.rotation.x = Math.PI;
    arch.position.set(0, 1.7, -1);
    group.add(arch);

  } else if (name === "loft") {
    // brutalist blocks
    const blocks = [
      { x: -1.2, y: -0.2, z: 0,    w: 1.0, h: 1.6, d: 1.2, c: 0xa6a6ad },
      { x:  0.6, y: -0.5, z: 0.2,  w: 1.6, h: 1.0, d: 1.4, c: 0x8c8c95 },
      { x: -0.1, y: -0.8, z: -1.0, w: 2.0, h: 0.4, d: 1.8, c: 0x7a7a83 },
      { x:  1.6, y:  0.1, z: -0.6, w: 0.6, h: 1.8, d: 0.6, c: 0xc4c2c8 },
    ];
    blocks.forEach((b) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat(b.c, 0.05, 0.85));
      m.position.set(b.x, b.y, b.z);
      group.add(m);
    });

  } else if (name === "forest") {
    // ground + trees (cones)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(4.5, 40), mat(0x8b9881, 0.0, 0.95));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.7;
    group.add(ground);
    for (let i = 0; i < 8; i++) {
      const r = 1.2 + Math.random() * 2.4;
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.6;
      const tree = new THREE.Mesh(
        new THREE.ConeGeometry(0.35 + Math.random() * 0.2, 1.6 + Math.random() * 0.8, 12),
        mat(0x3b4d3a, 0.0, 0.95)
      );
      tree.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
      group.add(tree);
    }
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat(0x7d7a72, 0.05, 0.9));
    rock.position.set(0.3, -0.4, 1.1);
    group.add(rock);

  } else if (name === "street") {
    // narrow alley — two long boxes + lanterns
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 5), mat(0x8a6a52, 0.0, 0.9));
    wall1.position.set(-1.4, 0.2, 0);
    const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 5), mat(0x6f5240, 0.0, 0.9));
    wall2.position.set(1.4, 0.3, 0);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 5), mat(0x55483d, 0.0, 0.95));
    ground.position.y = -0.9;
    group.add(wall1, wall2, ground);
    for (let i = -2; i <= 2; i++) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), mat(0xe6c285, 0.1, 0.4));
      lamp.position.set(-1.18, 0.8, i * 1.1);
      group.add(lamp);
      const lamp2 = lamp.clone();
      lamp2.position.x = 1.18;
      group.add(lamp2);
    }
  }

  scene.add(group);
  return group;
}

function mountWorldCanvas(host) {
  const name = host.dataset.world;
  const palette = WORLD_PALETTES[name];
  if (!palette) return;

  const canvas = document.createElement("canvas");
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(2.6, 1.6, 3.4);
  camera.lookAt(0, 0, 0);

  // Lighting — soft, slightly cool key + warm rim
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(4, 6, 4);
  scene.add(key);

  const fill = new THREE.HemisphereLight(0xffffff, 0xbfbfc6, 0.55);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffd8aa, 0.45);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const group = buildSceneFor(name, scene, palette);

  // Resize handling
  const ro = new ResizeObserver(() => {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  });
  ro.observe(host);

  let visible = true;
  const vio = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  });
  vio.observe(host);

  // Subtle pointer-driven parallax
  let mx = 0, my = 0, tx = 0, ty = 0;
  host.addEventListener("mousemove", (e) => {
    const r = host.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width  - 0.5) * 0.6;
    ty = ((e.clientY - r.top)  / r.height - 0.5) * 0.4;
  });
  host.addEventListener("mouseleave", () => { tx = 0; ty = 0; });

  let t = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    t += 0.0045;
    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    group.rotation.y = Math.sin(t) * 0.18 + mx;
    group.rotation.x = -0.05 + my * 0.4;
    renderer.render(scene, camera);
  }
  tick();
}

document.querySelectorAll("[data-world]").forEach(mountWorldCanvas);

/* ----------- HERO scene — decomposed mesh ----------- */
(function mountHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const host = canvas.parentElement;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(3.4, 2.2, 4.6);
  camera.lookAt(0, 0.1, 0);

  // Soft studio lighting — warm key + cool fill + faint rim
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(5, 7, 4);
  scene.add(key);
  const fill = new THREE.HemisphereLight(0xffffff, 0xbcc0ca, 0.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff0d6, 0.45);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // A "decomposed" cluster: a few primitives that drift apart slightly,
  // suggesting per-object mesh decomposition.
  const group = new THREE.Group();
  const ink   = new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.7, metalness: 0.05 });
  const stone = new THREE.MeshStandardMaterial({ color: 0xc8c4ba, roughness: 0.85, metalness: 0.0 });
  const accent= new THREE.MeshStandardMaterial({ color: 0xa8a3b3, roughness: 0.45, metalness: 0.25 });
  const warm  = new THREE.MeshStandardMaterial({ color: 0xb9a98a, roughness: 0.55, metalness: 0.1 });
  const cool  = new THREE.MeshStandardMaterial({ color: 0x8d97a8, roughness: 0.55, metalness: 0.15 });

  const pieces = [];

  // Floor slab
  const slab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 4.2), stone);
  slab.position.y = -0.9;
  pieces.push({ mesh: slab, home: slab.position.clone(), drift: new THREE.Vector3(0, -0.08, 0) });
  group.add(slab);

  // Central tall block
  const tall = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.9), ink);
  tall.position.set(0, 0.05, 0);
  pieces.push({ mesh: tall, home: tall.position.clone(), drift: new THREE.Vector3(0, 0.1, 0) });
  group.add(tall);

  // Sphere
  const sph = new THREE.Mesh(new THREE.SphereGeometry(0.45, 36, 28), accent);
  sph.position.set(-1.1, -0.2, 0.6);
  pieces.push({ mesh: sph, home: sph.position.clone(), drift: new THREE.Vector3(-0.18, 0.1, 0.18) });
  group.add(sph);

  // Cylinder
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 32), warm);
  cyl.position.set(1.1, -0.3, 0.4);
  pieces.push({ mesh: cyl, home: cyl.position.clone(), drift: new THREE.Vector3(0.18, 0.1, 0.12) });
  group.add(cyl);

  // Wedge
  const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 4), cool);
  wedge.position.set(0.6, -0.3, -1.0);
  wedge.rotation.y = Math.PI / 4;
  pieces.push({ mesh: wedge, home: wedge.position.clone(), drift: new THREE.Vector3(0.1, 0.05, -0.18) });
  group.add(wedge);

  // Small icosahedron
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), accent);
  ico.position.set(-0.9, 0.4, -0.8);
  pieces.push({ mesh: ico, home: ico.position.clone(), drift: new THREE.Vector3(-0.14, 0.18, -0.14) });
  group.add(ico);

  // Wireframe overlay on the central tall block — hints at "mesh-native"
  const wire = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 1.82, 0.92),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18 })
  );
  wire.position.copy(tall.position);
  group.add(wire);

  scene.add(group);

  // Resize
  const ro = new ResizeObserver(() => {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  });
  ro.observe(host);

  // Pointer parallax
  let tx = 0, ty = 0, mx = 0, my = 0;
  host.addEventListener("mousemove", (e) => {
    const r = host.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width  - 0.5) * 0.6;
    ty = ((e.clientY - r.top)  / r.height - 0.5) * 0.4;
  });
  host.addEventListener("mouseleave", () => { tx = 0; ty = 0; });

  let t = 0;
  function tick() {
    requestAnimationFrame(tick);
    t += 0.005;
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;

    // Slow drift / decomposition pulse
    const pulse = (Math.sin(t * 0.6) + 1) * 0.5; // 0..1
    pieces.forEach((p) => {
      p.mesh.position.x = p.home.x + p.drift.x * pulse;
      p.mesh.position.y = p.home.y + p.drift.y * pulse;
      p.mesh.position.z = p.home.z + p.drift.z * pulse;
    });
    wire.position.copy(tall.position);

    group.rotation.y = Math.sin(t * 0.6) * 0.18 + mx;
    group.rotation.x = -0.08 + my * 0.4;
    renderer.render(scene, camera);
  }
  tick();
})();
