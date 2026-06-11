import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/spine/ishua-capsule");

mkdirSync(outDir, { recursive: true });

const regions = {
  shadow: { w: 96, h: 20, svg: shadowSvg() },
  capsule: { w: 96, h: 130, svg: capsuleSvg() },
  highlight: { w: 28, h: 80, svg: highlightSvg() },
  "eye-white": { w: 28, h: 28, svg: eyeWhiteSvg() },
  "eye-pupil": { w: 12, h: 12, svg: eyePupilSvg() },
  mouth: { w: 24, h: 10, svg: mouthSvg() },
};

function shadowSvg() {
  return `<svg width="96" height="20" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="10" rx="44" ry="8" fill="#2d6a4f" opacity="0.18"/>
  </svg>`;
}

function capsuleSvg() {
  return `<svg width="96" height="130" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="80" height="114" rx="40" fill="#2d6a4f"/>
    <rect x="12" y="12" width="72" height="106" rx="36" fill="#358f6a"/>
    <rect x="18" y="18" width="60" height="94" rx="30" fill="#2d6a4f"/>
    <ellipse cx="34" cy="42" rx="10" ry="18" fill="#ffffff" opacity="0.12"/>
  </svg>`;
}

function highlightSvg() {
  return `<svg width="28" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="10" height="72" rx="5" fill="#ffffff" opacity="0.22"/>
  </svg>`;
}

function eyeWhiteSvg() {
  return `<svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="11" fill="#fffef9"/>
    <circle cx="14" cy="14" r="11" fill="none" stroke="#1a1814" stroke-width="1.5" opacity="0.15"/>
  </svg>`;
}

function eyePupilSvg() {
  return `<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="5" fill="#1a1814"/>
    <circle cx="8" cy="4.5" r="1.4" fill="#fffef9" opacity="0.85"/>
  </svg>`;
}

function mouthSvg() {
  return `<svg width="24" height="10" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4c4 5 12 5 16 0" fill="none" stroke="#c45c4a" stroke-linecap="round" stroke-width="2.2"/>
  </svg>`;
}

const atlasLines = ["ishua-capsule.png", "size: 256,256", "format: RGBA8888", "filter: Linear,Linear", "repeat: none"];

let cursorX = 2;
let cursorY = 2;
let rowHeight = 0;
const composites = [];

for (const [name, { w, h, svg }] of Object.entries(regions)) {
  if (cursorX + w + 2 > 256) {
    cursorX = 2;
    cursorY += rowHeight + 4;
    rowHeight = 0;
  }

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  composites.push({ input: buffer, left: cursorX, top: cursorY });

  atlasLines.push(
    name,
    "  rotate: false",
    `  xy: ${cursorX}, ${cursorY}`,
    `  size: ${w}, ${h}`,
    `  orig: ${w}, ${h}`,
    "  offset: 0, 0",
    "  index: -1",
  );

  cursorX += w + 4;
  rowHeight = Math.max(rowHeight, h);
}

await sharp({
  create: {
    width: 256,
    height: 256,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png()
  .toFile(join(outDir, "ishua-capsule.png"));

writeFileSync(join(outDir, "ishua-capsule.atlas"), `${atlasLines.join("\n")}\n`);

const skeleton = {
  skeleton: {
    hash: "ishua-capsule-v1",
    spine: "4.2.33",
    x: -48,
    y: -2,
    width: 96,
    height: 158,
    images: "./",
    audio: "",
  },
  bones: [
    { name: "root" },
    { name: "capsule", parent: "root", y: 72 },
    { name: "face", parent: "capsule", y: 28 },
    { name: "eye-l", parent: "face", x: -16, y: 10 },
    { name: "eye-r", parent: "face", x: 16, y: 10 },
    { name: "pupil-l", parent: "eye-l" },
    { name: "pupil-r", parent: "eye-r" },
  ],
  slots: [
    { name: "shadow", bone: "root", attachment: "shadow" },
    { name: "capsule", bone: "capsule", attachment: "capsule" },
    { name: "highlight", bone: "capsule", attachment: "highlight" },
    { name: "eye-l", bone: "eye-l", attachment: "eye-white" },
    { name: "eye-r", bone: "eye-r", attachment: "eye-white" },
    { name: "pupil-l", bone: "pupil-l", attachment: "eye-pupil" },
    { name: "pupil-r", bone: "pupil-r", attachment: "eye-pupil" },
    { name: "mouth", bone: "face", attachment: "mouth" },
  ],
  skins: [
    {
      name: "default",
      attachments: {
        shadow: {
          shadow: { x: 0, y: 6, width: 96, height: 20 },
        },
        capsule: {
          capsule: { x: 0, y: 0, width: 96, height: 130 },
        },
        highlight: {
          highlight: { x: -22, y: 8, width: 28, height: 80 },
        },
        "eye-l": {
          "eye-white": { width: 28, height: 28 },
        },
        "eye-r": {
          "eye-white": { width: 28, height: 28 },
        },
        "pupil-l": {
          "eye-pupil": { width: 12, height: 12 },
        },
        "pupil-r": {
          "eye-pupil": { width: 12, height: 12 },
        },
        mouth: {
          mouth: { x: 0, y: -8, width: 24, height: 10 },
        },
      },
    },
  ],
  animations: {
    idle: {
      bones: {
        capsule: {
          translate: [
            { time: 0 },
            { time: 0.9, y: 5, curve: "sine" },
            { time: 1.8 },
          ],
          scale: [
            { time: 0, x: 1, y: 1 },
            { time: 0.9, x: 1.03, y: 0.97, curve: "sine" },
            { time: 1.8, x: 1, y: 1 },
          ],
        },
        face: {
          translate: [
            { time: 0 },
            { time: 0.9, y: 2, curve: "sine" },
            { time: 1.8 },
          ],
        },
      },
    },
  },
};

writeFileSync(join(outDir, "ishua-capsule.json"), `${JSON.stringify(skeleton, null, 2)}\n`);

console.log(`Generated Spine capsule assets in ${outDir}`);
