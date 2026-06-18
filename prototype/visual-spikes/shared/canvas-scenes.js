const TAU = Math.PI * 2;

const scenePoints = {
  "star-map": [
    { x: 0.25, y: 0.34, r: 15, color: "#6fd3ff" },
    { x: 0.62, y: 0.27, r: 19, color: "#a779ff" },
    { x: 0.72, y: 0.68, r: 17, color: "#ffbe74" },
  ],
};

function resize(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, dpr };
}

function paintBase(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#071022");
  grad.addColorStop(0.45, "#0c1230");
  grad.addColorStop(1, "#050712");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function glow(ctx, x, y, radius, color, alpha = 0.55) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawStars(ctx, width, height, time, count = 110) {
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const seed = i * 97.13;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * width + time * (0.012 + (i % 5) * 0.002)) % width;
    const y = (Math.cos(seed * 1.7) * 0.5 + 0.5) * height;
    const pulse = 0.35 + Math.sin(time * 0.002 + i) * 0.25;
    ctx.globalAlpha = 0.25 + pulse;
    ctx.fillStyle = i % 7 === 0 ? "#ffbbea" : "#d7e8ff";
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + (i % 3) * 0.45, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackground(ctx, width, height, time) {
  paintBase(ctx, width, height);
  glow(ctx, width * 0.22, height * 0.28, width * 0.42, "rgba(111,211,255,0.58)", 0.34);
  glow(ctx, width * 0.76, height * 0.2, width * 0.36, "rgba(167,121,255,0.55)", 0.32);
  glow(ctx, width * 0.55, height * 0.82, width * 0.34, "rgba(255,114,210,0.42)", 0.2);
  drawStars(ctx, width, height, time, 150);
}

function drawStarMap(ctx, width, height, time) {
  drawBackground(ctx, width, height, time);
  const nodes = scenePoints["star-map"];

  ctx.save();
  ctx.lineWidth = Math.max(1, width * 0.003);
  ctx.strokeStyle = "rgba(145, 190, 255, 0.28)";
  ctx.beginPath();
  nodes.forEach((node, index) => {
    const x = node.x * width;
    const y = node.y * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  nodes.forEach((node, index) => {
    const x = node.x * width;
    const y = node.y * height;
    const pulse = 1 + Math.sin(time * 0.003 + index * 1.7) * 0.16;
    glow(ctx, x, y, node.r * 5 * pulse, node.color, 0.35);
    ctx.save();
    ctx.fillStyle = node.color;
    ctx.shadowColor = node.color;
    ctx.shadowBlur = node.r * 2.5;
    ctx.beginPath();
    ctx.arc(x, y, node.r * pulse, 0, TAU);
    ctx.fill();
    ctx.restore();
  });
}

function drawDreamGate(ctx, width, height, time) {
  drawBackground(ctx, width, height, time);
  const cx = width * 0.5;
  const cy = height * 0.52;
  const pulse = Math.sin(time * 0.003) * 0.5 + 0.5;

  for (let i = 0; i < 7; i += 1) {
    const radiusX = width * (0.13 + i * 0.035) + pulse * 22;
    const radiusY = height * (0.22 + i * 0.035) + pulse * 18;
    ctx.save();
    ctx.globalAlpha = 0.35 - i * 0.03;
    ctx.strokeStyle = i % 2 === 0 ? "#6fd3ff" : "#ffbbea";
    ctx.lineWidth = 2 + i * 0.5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  glow(ctx, cx, cy, width * 0.22, "rgba(255,255,255,0.72)", 0.34);
  glow(ctx, cx, cy, width * 0.34, "rgba(111,211,255,0.34)", 0.28);
}

export function mountCanvasScene(canvas, sceneName) {
  const ctx = canvas.getContext("2d");
  let frame = 0;
  let raf = 0;

  const render = (time) => {
    const { width, height } = resize(canvas);
    if (sceneName === "star-map") drawStarMap(ctx, width, height, time);
    else if (sceneName === "dream-gate") drawDreamGate(ctx, width, height, time);
    else drawBackground(ctx, width, height, time);
    frame += 1;
    canvas.dataset.frames = String(frame);
    raf = requestAnimationFrame(render);
  };

  raf = requestAnimationFrame(render);

  return () => cancelAnimationFrame(raf);
}
