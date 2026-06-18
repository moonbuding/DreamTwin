import { mountCanvasScene } from "./canvas-scenes.js";
import { mountThreeScene } from "./three-scenes.js";

const cleanups = [];

document.querySelectorAll("[data-canvas-scene]").forEach((canvas) => {
  cleanups.push(mountCanvasScene(canvas, canvas.dataset.canvasScene));
});

document.querySelectorAll("[data-three-scene]").forEach((canvas) => {
  cleanups.push(mountThreeScene(canvas, canvas.dataset.threeScene));
});

window.addEventListener("pagehide", () => {
  cleanups.forEach((cleanup) => cleanup());
});
