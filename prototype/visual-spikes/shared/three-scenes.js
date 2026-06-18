import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x050713, 1);
  return renderer;
}

function resize(renderer, camera, canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const size = renderer.getSize(new THREE.Vector2());
  if (size.x !== width || size.y !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function makeStars(count, spread, size = 0.035) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color("#6fd3ff"),
    new THREE.Color("#a779ff"),
    new THREE.Color("#ff72d2"),
    new THREE.Color("#f4f7ff"),
  ];

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * spread;
    positions[i3 + 1] = (Math.random() - 0.5) * spread * 0.76;
    positions[i3 + 2] = (Math.random() - 0.5) * spread;
    const color = palette[i % palette.length];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 0.84,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

function makeOrb(color, radius = 0.22) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
  });
  const orb = new THREE.Mesh(geometry, material);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.8, 32, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  orb.add(halo);
  return orb;
}

function makeBackgroundScene(scene) {
  const stars = makeStars(520, 7.8, 0.028);
  const mist = makeStars(130, 5.2, 0.07);
  scene.add(stars, mist);
  return ({ time }) => {
    stars.rotation.y = time * 0.00009;
    stars.rotation.x = Math.sin(time * 0.00014) * 0.08;
    mist.rotation.y = -time * 0.00016;
    mist.position.z = Math.sin(time * 0.00045) * 0.28;
  };
}

function makeStarMapScene(scene) {
  const stars = makeStars(360, 7.2, 0.026);
  scene.add(stars);

  const nodeData = [
    { position: [-1.55, 0.62, 0.1], color: "#6fd3ff" },
    { position: [0.62, 0.92, -0.35], color: "#a779ff" },
    { position: [1.28, -0.74, 0.32], color: "#ffbe74" },
  ];
  const nodes = nodeData.map((node) => {
    const orb = makeOrb(node.color, 0.18);
    orb.position.set(...node.position);
    scene.add(orb);
    return orb;
  });

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(
    nodes.map((node) => node.position).concat([nodes[0].position]),
  );
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: "#8dcfff",
      transparent: true,
      opacity: 0.26,
    }),
  );
  scene.add(line);

  return ({ time }) => {
    stars.rotation.y = time * 0.0001;
    nodes.forEach((node, index) => {
      const pulse = 1 + Math.sin(time * 0.003 + index) * 0.12;
      node.scale.setScalar(pulse);
      node.rotation.y = time * 0.0008 + index;
    });
    line.rotation.y = Math.sin(time * 0.00055) * 0.08;
  };
}

function makeDreamGateScene(scene) {
  const stars = makeStars(340, 7.4, 0.026);
  scene.add(stars);

  const group = new THREE.Group();
  scene.add(group);

  const ringColors = ["#6fd3ff", "#a779ff", "#ff72d2", "#ffffff"];
  const rings = ringColors.map((color, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.78 + index * 0.18, 0.012 + index * 0.005, 24, 132),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.58 - index * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.z = index * 0.12;
    ring.scale.y = 1.38;
    group.add(ring);
    return ring;
  });

  const veil = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 96),
    new THREE.MeshBasicMaterial({
      color: "#dfeeff",
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  veil.scale.y = 1.46;
  veil.position.z = -0.03;
  group.add(veil);

  const core = makeOrb("#f6fbff", 0.24);
  core.position.z = 0.05;
  group.add(core);

  return ({ time }) => {
    stars.rotation.y = -time * 0.0001;
    group.rotation.y = Math.sin(time * 0.0005) * 0.22;
    rings.forEach((ring, index) => {
      const scale = 1 + Math.sin(time * 0.0024 + index) * 0.1;
      ring.scale.set(scale * 0.88, scale * 1.38, scale);
      ring.rotation.z += 0.002 + index * 0.0008;
    });
    core.scale.setScalar(1 + Math.sin(time * 0.0032) * 0.1);
    veil.scale.set(1 + Math.sin(time * 0.002) * 0.05, 1.46 + Math.sin(time * 0.002) * 0.08, 1);
  };
}

export function mountThreeScene(canvas, sceneName) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060816, 0.09);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  camera.position.set(0, 0, 4.2);

  const ambient = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambient);

  const animateScene =
    sceneName === "star-map"
      ? makeStarMapScene(scene)
      : sceneName === "dream-gate"
        ? makeDreamGateScene(scene)
        : makeBackgroundScene(scene);

  let frame = 0;
  let raf = 0;
  const render = (time) => {
    resize(renderer, camera, canvas);
    animateScene({ time });
    renderer.render(scene, camera);
    frame += 1;
    canvas.dataset.frames = String(frame);
    raf = requestAnimationFrame(render);
  };

  raf = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(raf);
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material.dispose();
      }
    });
    renderer.dispose();
  };
}
