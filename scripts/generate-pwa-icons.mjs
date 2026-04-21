import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(dir, { recursive: true });

const bg = { r: 15, g: 107, b: 92 };

function svgForSize(size) {
  const fontSize = Math.round(size * 0.42);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="rgb(${bg.r},${bg.g},${bg.b})"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui,Segoe UI,sans-serif" font-weight="700" font-size="${fontSize}" fill="white">Д</text>
</svg>`;
}

async function makePng(size, filename) {
  const buf = Buffer.from(svgForSize(size));
  await sharp(buf).png().toFile(path.join(dir, filename));
}

await makePng(192, "icon-192.png");
await makePng(512, "icon-512.png");
console.log("PWA icons written to public/icons/");
