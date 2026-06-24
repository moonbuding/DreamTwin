import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  FogExp2,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import type { SceneVariant, ThreeDreamSceneProps } from "./ThreeDreamScene";
import type { AvatarStyleSpec } from "../types/dreamtwin";

type Ticker = (time: number) => void;

function makeStars(count: number, spread: number, size: number) {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [new Color("#6fd3ff"), new Color("#a779ff"), new Color("#ff72d2"), new Color("#f4f7ff")];

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

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));

  return new Points(
    geometry,
    new PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
}

function makeOrb(color: string, radius: number) {
  const orb = new Mesh(
    new SphereGeometry(radius, 24, 18),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
  const halo = new Mesh(
    new SphereGeometry(radius * 1.95, 24, 18),
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.13,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  orb.add(halo);
  return orb;
}

function makeLine(points: Vector3[], color: string, opacity: number) {
  return new Line(
    new BufferGeometry().setFromPoints(points),
    new LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
}

function addPersonalityProjection(scene: Scene, tickers: Ticker[]) {
  const group = new Group();
  scene.add(group);

  const core = makeOrb("#f6fbff", 0.22);
  core.position.set(0, 0.05, 0);
  group.add(core);

  ["#6fd3ff", "#a779ff", "#ff72d2"].forEach((color, index) => {
    const ring = new Mesh(
      new TorusGeometry(0.78 + index * 0.2, 0.009 + index * 0.004, 18, 120),
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5 - index * 0.08,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = 1.16 + index * 0.34;
    ring.rotation.y = index * 0.48;
    ring.scale.y = 1.32;
    group.add(ring);
  });

  const upperArc = makeLine(
    [
      new Vector3(-0.58, 0.82, -0.1),
      new Vector3(-0.26, 1.06, 0.12),
      new Vector3(0.24, 1.06, 0.08),
      new Vector3(0.58, 0.82, -0.12),
    ],
    "#dff8ff",
    0.34,
  );
  const lowerArc = makeLine(
    [
      new Vector3(-0.42, -0.82, 0.04),
      new Vector3(-0.12, -1.02, -0.1),
      new Vector3(0.22, -0.96, 0.08),
      new Vector3(0.48, -0.72, -0.02),
    ],
    "#ff9ce0",
    0.24,
  );
  group.add(upperArc, lowerArc);

  const particles = makeStars(150, 2.35, 0.018);
  particles.position.set(0, 0.02, 0);
  group.add(particles);

  tickers.push((time) => {
    group.rotation.y = Math.sin(time * 0.00052) * 0.28;
    group.rotation.x = Math.sin(time * 0.00036) * 0.06;
    core.scale.setScalar(1 + Math.sin(time * 0.0026) * 0.08);
    particles.rotation.y = time * 0.00042;
    group.children.forEach((child, index) => {
      if (child === core || child === particles) return;
      child.rotation.z += 0.0012 + index * 0.0002;
    });
  });
}

const defaultAvatarStyle: AvatarStyleSpec = {
  silhouette: "full_body_luminous",
  posture: "reserved",
  material: "mist-light",
  auraColor: "#6fd3ff",
  secondaryColor: "#a779ff",
  accentColor: "#ff72d2",
  motionSignature: "slow_orbit",
  keywords: ["慢热", "高共情", "真实感"],
};

function makeGlowMaterial(color: string, opacity: number) {
  return new MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
  });
}

function addAvatarProjection(scene: Scene, tickers: Ticker[], avatarStyleSpec?: AvatarStyleSpec) {
  const style = avatarStyleSpec || defaultAvatarStyle;
  const colors = {
    aura: style.auraColor || defaultAvatarStyle.auraColor,
    secondary: style.secondaryColor || defaultAvatarStyle.secondaryColor,
    accent: style.accentColor || defaultAvatarStyle.accentColor,
  };
  const group = new Group();
  group.position.set(0, 0.3, 0);
  group.scale.setScalar(1.12);
  scene.add(group);

  const torsoOpacity = style.material === "glass-light" ? 0.2 : style.material === "star-thread" ? 0.14 : 0.18;
  const silhouetteOpacity = style.material === "star-thread" ? 0.1 : 0.13;
  const head = new Mesh(new SphereGeometry(0.2, 28, 20), makeGlowMaterial("#f6fbff", 0.78));
  head.position.set(0, 0.92, 0);
  group.add(head);

  const headHalo = new Mesh(new SphereGeometry(0.38, 28, 20), makeGlowMaterial(colors.aura, 0.14));
  headHalo.position.copy(head.position);
  group.add(headHalo);

  const bodyShell = new Mesh(
    new CylinderGeometry(0.24, 0.46, 1.28, 36, 1, true),
    makeGlowMaterial(colors.secondary, silhouetteOpacity),
  );
  bodyShell.position.set(0, 0.18, -0.04);
  bodyShell.rotation.z = style.posture === "curious" ? 0.04 : style.posture === "open" ? -0.03 : 0;
  group.add(bodyShell);

  const torso = new Mesh(new CylinderGeometry(0.18, 0.36, 0.92, 32, 1, true), makeGlowMaterial(colors.aura, torsoOpacity + 0.08));
  torso.position.set(0, 0.34, 0);
  group.add(torso);

  const neck = makeLine([new Vector3(0, 0.78, 0.02), new Vector3(0, 0.68, 0.02)], colors.accent, 0.36);
  const spine = makeLine([new Vector3(0, 0.8, 0.02), new Vector3(0, -0.16, 0.02)], "#f6fbff", 0.36);
  group.add(neck, spine);

  const chestCore = makeOrb(colors.accent, 0.12);
  chestCore.position.set(0, 0.52, 0.04);
  group.add(chestCore);

  const postureSpread =
    style.posture === "open" ? 0.86 : style.posture === "curious" ? 0.68 : style.posture === "grounded" ? 0.58 : 0.5;
  const shoulderY = 0.62;
  const handY = style.posture === "open" ? 0.3 : style.posture === "curious" ? 0.24 : 0.18;
  const footSpread = style.posture === "grounded" ? 0.36 : 0.28;
  const tilt = style.posture === "curious" ? 0.08 : 0;

  const shoulder = makeLine([new Vector3(-0.42, shoulderY, 0), new Vector3(0.42, shoulderY, 0)], colors.secondary, 0.44);
  const waist = makeLine([new Vector3(-0.28, 0.06, 0), new Vector3(0.28, 0.06, 0)], colors.accent, 0.28);
  const leftContour = makeLine(
    [new Vector3(-0.24, 0.78, -0.04), new Vector3(-0.48, 0.4, -0.02), new Vector3(-0.34, -0.26, 0.02), new Vector3(-0.16, -0.76, -0.02)],
    colors.aura,
    0.2,
  );
  const rightContour = makeLine(
    [new Vector3(0.24, 0.78, -0.04), new Vector3(0.48, 0.4, -0.02), new Vector3(0.34, -0.26, 0.02), new Vector3(0.16, -0.76, -0.02)],
    colors.aura,
    0.2,
  );
  const leftArm = makeLine(
    [new Vector3(-0.34, shoulderY, 0), new Vector3(-postureSpread, handY, -0.02)],
    colors.secondary,
    0.42,
  );
  const rightArm = makeLine(
    [new Vector3(0.34, shoulderY, 0), new Vector3(postureSpread, handY + tilt, -0.02)],
    colors.secondary,
    0.42,
  );
  const leftLeg = makeLine([new Vector3(-0.14, -0.08, 0), new Vector3(-footSpread, -0.74, -0.02)], colors.aura, 0.4);
  const rightLeg = makeLine([new Vector3(0.14, -0.08, 0), new Vector3(footSpread, -0.74, -0.02)], colors.aura, 0.4);
  group.add(shoulder, waist, leftContour, rightContour, leftArm, rightArm, leftLeg, rightLeg);

  [
    { position: new Vector3(-postureSpread, handY, -0.02), radius: 0.045 },
    { position: new Vector3(postureSpread, handY + tilt, -0.02), radius: 0.045 },
    { position: new Vector3(-footSpread, -0.74, -0.02), radius: 0.04 },
    { position: new Vector3(footSpread, -0.74, -0.02), radius: 0.04 },
  ].forEach(({ position, radius }) => {
    const hand = makeOrb(colors.accent, radius);
    hand.position.copy(position);
    group.add(hand);
  });

  const bodyRing = new Mesh(
    new TorusGeometry(0.58, 0.006, 14, 112),
    makeGlowMaterial(colors.secondary, style.motionSignature === "spark_drift" ? 0.34 : 0.26),
  );
  bodyRing.rotation.x = 1.18;
  bodyRing.position.set(0, 0.28, -0.02);
  group.add(bodyRing);

  const auraRing = new Mesh(new TorusGeometry(0.98, 0.008, 14, 128), makeGlowMaterial(colors.aura, 0.22));
  auraRing.rotation.x = 1.34;
  auraRing.rotation.z = -0.28;
  auraRing.scale.y = 1.24;
  group.add(auraRing);

  const groundRing = new Mesh(new TorusGeometry(0.62, 0.007, 14, 112), makeGlowMaterial(colors.accent, 0.2));
  groundRing.rotation.x = 1.46;
  groundRing.position.set(0, -0.84, -0.02);
  groundRing.scale.y = 0.38;
  group.add(groundRing);

  const identityThreads = style.keywords.slice(0, 3).map((_, index) => {
    const thread = makeLine(
      [
        new Vector3(-0.9 + index * 0.28, 0.88 - index * 0.12, -0.16),
        new Vector3(-0.2 + index * 0.22, 0.48 - index * 0.02, 0.08),
        new Vector3(0.74 - index * 0.22, 0.12 - index * 0.16, -0.1),
      ],
      index === 0 ? colors.aura : index === 1 ? colors.secondary : colors.accent,
      0.16,
    );
    group.add(thread);
    return thread;
  });

  const particles = makeStars(style.motionSignature === "spark_drift" ? 210 : 160, 2.85, 0.016);
  particles.position.set(0, 0.15, 0);
  group.add(particles);

  tickers.push((time) => {
    const slow = time * 0.00042;
    const pulseSpeed = style.motionSignature === "soft_pulse" ? 0.0032 : 0.0022;
    group.rotation.y = Math.sin(slow) * (style.posture === "open" ? 0.18 : 0.12);
    group.rotation.z = style.posture === "curious" ? Math.sin(time * 0.0006) * 0.035 : 0;
    chestCore.scale.setScalar(1 + Math.sin(time * pulseSpeed) * 0.1);
    headHalo.scale.setScalar(1 + Math.sin(time * 0.0018) * 0.06);
    bodyShell.scale.set(1 + Math.sin(time * 0.0014) * 0.025, 1 + Math.sin(time * 0.0016) * 0.04, 1);
    bodyRing.rotation.z = time * 0.00055;
    auraRing.rotation.z = -time * 0.00034;
    groundRing.rotation.z = time * 0.00028;
    identityThreads.forEach((thread, index) => {
      thread.rotation.z = Math.sin(time * 0.0005 + index) * 0.05;
    });
    particles.rotation.y = time * (style.motionSignature === "spark_drift" ? 0.0007 : 0.00038);
  });
}

function stageColors(variant: SceneVariant) {
  if (variant === "stage-rain") {
    return { primary: "#6fd3ff", secondary: "#a779ff", accent: "#f6fbff", warm: "#ffbe74" };
  }
  if (variant === "stage-ocean") {
    return { primary: "#4bd8ff", secondary: "#4de0b6", accent: "#dff8ff", warm: "#7aa8ff" };
  }
  if (variant === "stage-space") {
    return { primary: "#a779ff", secondary: "#ff72d2", accent: "#f6fbff", warm: "#6fd3ff" };
  }
  if (variant === "stage-social") {
    return { primary: "#ffbe74", secondary: "#ff72d2", accent: "#f6fbff", warm: "#6fd3ff" };
  }
  return { primary: "#ffbe74", secondary: "#6fd3ff", accent: "#f6fbff", warm: "#ff72d2" };
}

function addDreamStage(scene: Scene, variant: SceneVariant, tickers: Ticker[]) {
  const colors = stageColors(variant);
  const group = new Group();
  scene.add(group);

  const horizon = makeLine(
    [new Vector3(-2.4, -0.5, -0.55), new Vector3(-0.7, -0.38, -0.72), new Vector3(0.9, -0.42, -0.66), new Vector3(2.4, -0.52, -0.52)],
    colors.primary,
    0.32,
  );
  const depthArc = makeLine(
    [new Vector3(-1.6, 0.62, -0.7), new Vector3(-0.4, 0.92, -1), new Vector3(0.8, 0.72, -0.9), new Vector3(1.7, 0.3, -0.62)],
    colors.secondary,
    0.24,
  );
  group.add(horizon, depthArc);

  const center = makeOrb(colors.primary, variant === "stage-social" ? 0.12 : 0.16);
  center.position.set(0.18, -0.05, -0.28);
  group.add(center);

  const marker = makeOrb(colors.secondary, 0.09);
  marker.position.set(-0.7, 0.32, -0.72);
  group.add(marker);

  const farMarker = makeOrb(colors.warm, 0.08);
  farMarker.position.set(0.86, 0.44, -0.88);
  group.add(farMarker);

  if (variant === "stage-rain") {
    for (let index = 0; index < 12; index += 1) {
      const x = -2.2 + index * 0.4;
      const rain = makeLine([new Vector3(x, 1.34, -0.52), new Vector3(x - 0.16, 0.6, -0.52)], colors.accent, 0.18);
      group.add(rain);
    }
  }

  if (variant === "stage-ocean") {
    for (let index = 0; index < 4; index += 1) {
      const ring = new Mesh(
        new TorusGeometry(0.56 + index * 0.22, 0.007, 12, 96),
        new MeshBasicMaterial({
          color: index % 2 === 0 ? colors.primary : colors.secondary,
          transparent: true,
          opacity: 0.28 - index * 0.035,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      ring.rotation.x = 1.24;
      ring.position.y = -0.4 + index * 0.08;
      group.add(ring);
    }
  }

  if (variant === "stage-space") {
    ["#6fd3ff", "#a779ff", "#ff72d2"].forEach((color, index) => {
      const orbit = new Mesh(
        new TorusGeometry(0.84 + index * 0.24, 0.006, 12, 112),
        new MeshBasicMaterial({ color, transparent: true, opacity: 0.26, blending: AdditiveBlending, depthWrite: false }),
      );
      orbit.rotation.x = 1.06 + index * 0.18;
      orbit.rotation.z = index * 0.45;
      group.add(orbit);
    });
  }

  if (variant === "stage-social") {
    const counter = makeLine(
      [new Vector3(-1.48, -0.72, -0.36), new Vector3(-0.34, -0.5, -0.6), new Vector3(1.22, -0.62, -0.48)],
      colors.warm,
      0.42,
    );
    const glow = makeOrb(colors.warm, 0.1);
    glow.position.set(-0.9, 0.46, -0.7);
    group.add(counter, glow);
  }

  if (variant === "stage-motion") {
    const courtA = makeLine([new Vector3(-1.6, -0.66, -0.6), new Vector3(1.6, -0.66, -0.6)], colors.primary, 0.34);
    const courtB = makeLine([new Vector3(-0.2, -0.94, -0.35), new Vector3(0.2, 0.54, -0.76)], colors.secondary, 0.26);
    const shuttle = makeOrb(colors.accent, 0.075);
    shuttle.position.set(0.62, 0.76, -0.44);
    group.add(courtA, courtB, shuttle);
  }

  tickers.push((time) => {
    group.rotation.y = Math.sin(time * 0.00038) * 0.16;
    group.children.forEach((child, index) => {
      const pulse = 1 + Math.sin(time * 0.002 + index * 0.45) * 0.04;
      child.scale.setScalar(pulse);
    });
  });
}

function setupScene(scene: Scene, variant: SceneVariant, avatarStyleSpec?: AvatarStyleSpec) {
  const tickers: Ticker[] = [];
  const isProjection = variant === "projection";
  const isAvatar = variant === "avatar";
  const isStage = variant.startsWith("stage-");
  const stars = makeStars(
    isProjection || isAvatar ? 180 : variant === "ambient" || isStage ? 420 : 280,
    7.6,
    isProjection || isAvatar ? 0.018 : variant === "ambient" || isStage ? 0.032 : 0.026,
  );
  scene.add(stars);
  tickers.push((time) => {
    stars.rotation.y = time * 0.0001;
    stars.rotation.x = Math.sin(time * 0.00018) * 0.08;
  });

  if (variant === "projection") {
    addPersonalityProjection(scene, tickers);
  }

  if (variant === "avatar") {
    addAvatarProjection(scene, tickers, avatarStyleSpec);
  }

  if (isStage) {
    addDreamStage(scene, variant, tickers);
  }

  if (variant === "star-map") {
    const nodeData: Array<{ position: [number, number, number]; color: string }> = [
      { position: [-1.14, 0.54, 0.1], color: "#6fd3ff" },
      { position: [0.46, 0.82, -0.35], color: "#a779ff" },
      { position: [0.96, -0.66, 0.32], color: "#ffbe74" },
    ];
    const nodes = nodeData.map((node) => {
      const orb = makeOrb(node.color, 0.18);
      orb.position.set(...node.position);
      scene.add(orb);
      return orb;
    });
    const line = new Line(
      new BufferGeometry().setFromPoints(nodes.map((node) => node.position).concat([nodes[0].position])),
      new LineBasicMaterial({ color: "#8dcfff", transparent: true, opacity: 0.22 }),
    );
    scene.add(line);
    tickers.push((time) => {
      nodes.forEach((node, index) => {
        const pulse = 1 + Math.sin(time * 0.003 + index) * 0.1;
        node.scale.setScalar(pulse);
      });
      line.rotation.y = Math.sin(time * 0.00055) * 0.08;
    });
  }

  if (variant === "gate") {
    const group = new Group();
    scene.add(group);
    ["#6fd3ff", "#a779ff", "#ff72d2", "#ffffff"].forEach((color, index) => {
      const ring = new Mesh(
        new TorusGeometry(0.72 + index * 0.2, 0.012 + index * 0.005, 18, 96),
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.58 - index * 0.08,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      ring.scale.y = 1.38;
      ring.rotation.z = index * 0.12;
      group.add(ring);
    });
    group.add(makeOrb("#f6fbff", 0.22));
    tickers.push((time) => {
      group.rotation.y = Math.sin(time * 0.0005) * 0.2;
      group.children.forEach((child, index) => {
        const pulse = 1 + Math.sin(time * 0.0024 + index) * 0.1;
        child.scale.set(pulse * 0.9, pulse * 1.35, pulse);
      });
    });
  }

  return tickers;
}

function disposeSceneObject(object: Object3D) {
  const maybeDisposable = object as Object3D & {
    geometry?: { dispose: () => void };
    material?: Material | Material[];
  };

  maybeDisposable.geometry?.dispose();
  if (Array.isArray(maybeDisposable.material)) {
    maybeDisposable.material.forEach((material) => material.dispose());
    return;
  }
  maybeDisposable.material?.dispose();
}

export function ThreeDreamSceneRenderer({ variant, className = "", avatarStyleSpec }: ThreeDreamSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      canvas.classList.add("three-scene-unavailable");
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x060816, 1);

    const scene = new Scene();
    scene.fog = new FogExp2(0x060816, 0.09);
    scene.add(new AmbientLight(0xffffff, 1.6));

    const camera = new PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    const tickers = setupScene(scene, variant, avatarStyleSpec);

    let raf = 0;
    const sizeVector = new Vector2();
    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const size = renderer.getSize(sizeVector);
      if (size.x !== width || size.y !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      tickers.forEach((ticker) => ticker(time));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      scene.traverse(disposeSceneObject);
      renderer.renderLists.dispose();
      renderer.dispose();
    };
  }, [avatarStyleSpec, variant]);

  return <canvas ref={canvasRef} className={`three-scene ${className}`} aria-hidden="true" />;
}
