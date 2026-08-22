// scripts/make-favicon.js
// Crops s2r2-logo.png into a circular 256x256 PNG used as the browser tab favicon.
"use strict";

const sharp = require("sharp");
const path  = require("path");

const SRC  = path.join(__dirname, "../public/s2r2-logo.png");
const SIZE = 256;

// SVG circle mask — white circle on transparent background
const circleMask = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}">
     <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="white"/>
   </svg>`
);

async function main() {
  // 1 — Resize to 256×256, composite the circular mask, output PNG with alpha
  await sharp(SRC)
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toFile(path.join(__dirname, "../public/favicon-circle.png"));

  console.log("✅ public/favicon-circle.png — 256×256 circle");

  // 2 — Copy into app/ so Next.js metadata API picks it up
  await sharp(SRC)
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toFile(path.join(__dirname, "../app/icon.png"));

  console.log("✅ app/icon.png — Next.js favicon");

  // 3 — 180×180 apple touch icon
  const appleSize = 180;
  const appleMask = Buffer.from(
    `<svg width="${appleSize}" height="${appleSize}">
       <circle cx="${appleSize / 2}" cy="${appleSize / 2}" r="${appleSize / 2}" fill="white"/>
     </svg>`
  );
  await sharp(SRC)
    .resize(appleSize, appleSize, { fit: "cover", position: "centre" })
    .composite([{ input: appleMask, blend: "dest-in" }])
    .png()
    .toFile(path.join(__dirname, "../app/apple-icon.png"));

  console.log("✅ app/apple-icon.png — 180×180 apple touch icon");
}

main().catch(e => { console.error(e); process.exit(1); });
