import { copyFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const index = resolve(root, "apps/portfolio/dist/index.html");
const fallback = resolve(root, "apps/portfolio/dist/404.html");

try {
  await stat(index);
} catch {
  throw new Error("Portfolio build not found. Build the portfolio before creating its fallback.");
}

await copyFile(index, fallback);
