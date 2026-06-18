import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
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
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import type { SceneVariant, ThreeDreamSceneProps } from "./ThreeDreamScene";

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

function setupScene(scene: Scene, variant: SceneVariant) {
  const tickers: Array<(time: number) => void> = [];
  const stars = makeStars(variant === "ambient" ? 420 : 280, 7.6, variant === "ambient" ? 0.032 : 0.026);
  scene.add(stars);
  tickers.push((time) => {
    stars.rotation.y = time * 0.0001;
    stars.rotation.x = Math.sin(time * 0.00018) * 0.08;
  });

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

export function ThreeDreamSceneRenderer({ variant, className = "" }: ThreeDreamSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x060816, 1);

    const scene = new Scene();
    scene.fog = new FogExp2(0x060816, 0.09);
    scene.add(new AmbientLight(0xffffff, 1.6));

    const camera = new PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    const tickers = setupScene(scene, variant);

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
      renderer.dispose();
    };
  }, [variant]);

  return <canvas ref={canvasRef} className={`three-scene ${className}`} aria-hidden="true" />;
}
