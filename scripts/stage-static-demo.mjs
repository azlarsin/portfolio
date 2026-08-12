import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const source = resolve(root, "layered-route-lab/dist-static");
const target = resolve(
  root,
  "apps/portfolio/public/demos/layered-route-lab",
);

try {
  await stat(source);
} catch {
  throw new Error("Static Demo build not found. Run the static Demo build first.");
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
