import { copyFile, mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const index = resolve(root, "apps/portfolio/dist/index.html");
const fallback = resolve(root, "apps/portfolio/dist/404.html");
const pokeRenderDirectory = resolve(root, "apps/portfolio/dist/poke/render");
const pokeRenderIndex = resolve(pokeRenderDirectory, "index.html");

try {
  await stat(index);
} catch {
  throw new Error("Portfolio build not found. Build the portfolio before creating its fallback.");
}

await mkdir(pokeRenderDirectory, { recursive: true });
await Promise.all([
  copyFile(index, fallback),
  copyFile(index, pokeRenderIndex),
]);
