import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generator = process.env.BABY_GENERATOR_MODULE || resolve(root, '../../../azlar-admin/apps/api/src/baby/baby-generate.mjs');
const { generatePortraitAssets, disposePortraitGenerator, ASSET_REVISION } = await import(pathToFileURL(generator).href);
// Metadata is data-only; this is an offline maintenance script, not a production dependency on Admin.
const source = await readFile(resolve(root, 'src/components/companion/companionPhotos.ts'), 'utf8');
const photos = JSON.parse(source.slice(source.indexOf('= {') + 2));
const folder = resolve(root, 'public/portraits/generated', ASSET_REVISION);
await mkdir(folder, { recursive: true });
const manifest = {};
try {
  for (const [pose, photo] of Object.entries(photos)) {
    const { files, stats } = await generatePortraitAssets(await readFile(resolve(root, `public${photo.src}`)), { frame: photo, pose });
    await mkdir(resolve(folder, pose), { recursive: true });
    for (const [name, bytes] of Object.entries(files)) await writeFile(resolve(folder, pose, name), bytes);
    const base = `/portraits/generated/${ASSET_REVISION}/${pose}`;
    manifest[pose] = { revision: ASSET_REVISION, photo: `${base}/photo.webp`, thumbnail: `${base}/photo-thumb.webp`, svg: `${base}/portrait.svg`, svgPreview: `${base}/svg.webp`, svgThumbnail: `${base}/svg-thumb.webp`, model: `${base}/portrait.glb`, modelPreview: `${base}/model.webp`, modelThumbnail: `${base}/model-thumb.webp` };
    console.log(pose, stats);
  }
  await writeFile(resolve(root, 'src/components/baby/generatedAssets.json'), JSON.stringify(manifest, null, 2) + '\n');
} finally { await disposePortraitGenerator(); }
