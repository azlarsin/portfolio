import { readFileSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = resolve(appDirectory, 'dist');
const publicDirectory = resolve(appDirectory, 'public');
const MEDIA_TAG_PATTERN = /<(img|iframe)\b([^>]*)>/giu;

function hasAttribute(attributes, name) {
  return new RegExp(`(?:^|\\s)${name}\\s*=`, 'iu').test(attributes);
}

function attributeValue(attributes, name) {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'iu').exec(attributes);
  return match?.[2];
}

function imageDimensions(buffer) {
  if (buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 10 && buffer.toString('ascii', 0, 3) === 'GIF') {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (buffer.length >= 26 && buffer.toString('ascii', 0, 2) === 'BM') {
    return { width: Math.abs(buffer.readInt32LE(18)), height: Math.abs(buffer.readInt32LE(22)) };
  }
  if (buffer.length >= 4 && buffer.readUInt16BE(0) === 0xffd8) {
    const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset + 8 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda || offset + 2 > buffer.length) break;
      const segmentLength = buffer.readUInt16BE(offset);
      if (startOfFrame.has(marker) && offset + 7 < buffer.length) {
        return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
      }
      if (segmentLength < 2) break;
      offset += segmentLength;
    }
  }
  return undefined;
}

async function localImageDimensions() {
  const dimensions = new Map();
  for (const file of await listFiles(resolve(publicDirectory, 'images'))) {
    const size = imageDimensions(readFileSync(file));
    if (!size) continue;
    const publicPath = `/${relative(publicDirectory, file).split(sep).join('/')}`;
    dimensions.set(publicPath, size);
  }
  return dimensions;
}

function localImagePath(source) {
  try {
    const path = decodeURIComponent(new URL(source, 'https://blog.azlar.cc').pathname);
    return path.startsWith('/images/') ? path : undefined;
  } catch {
    return undefined;
  }
}

function iframeTitle(attributes, index) {
  const source = attributeValue(attributes, 'src') ?? '';
  if (/youtube\.com|youtu\.be/iu.test(source)) return '嵌入式视频';
  if (/jsfiddle\.net/iu.test(source)) return `嵌入式代码示例 ${index}`;
  return `嵌入式内容 ${index}`;
}

function addMediaDefaults(html, counters, dimensions) {
  let iframeIndex = 0;
  return html.replace(MEDIA_TAG_PATTERN, (_match, rawTagName, rawAttributes) => {
    const tagName = rawTagName.toLowerCase();
    const selfClosing = /\/\s*$/u.test(rawAttributes);
    const attributes = selfClosing ? rawAttributes.replace(/\/\s*$/u, '') : rawAttributes;
    const defaults = [];

    if (!hasAttribute(attributes, 'loading')) defaults.push('loading="lazy"');
    if (tagName === 'img') {
      if (!hasAttribute(attributes, 'decoding')) defaults.push('decoding="async"');
      const path = localImagePath(attributeValue(attributes, 'src') ?? '');
      const size = path ? dimensions.get(path) : undefined;
      if (size && !hasAttribute(attributes, 'width')) defaults.push(`width="${size.width}"`);
      if (size && !hasAttribute(attributes, 'height')) defaults.push(`height="${size.height}"`);
    } else {
      iframeIndex += 1;
      if (!hasAttribute(attributes, 'title')) defaults.push(`title="${iframeTitle(attributes, iframeIndex)}"`);
    }
    if (defaults.length === 0) return _match;

    counters[tagName] += 1;
    return `<${tagName}${attributes} ${defaults.join(' ')}${selfClosing ? ' /' : ''}>`;
  });
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return [path];
  }));
  return files.flat();
}

const counters = { img: 0, iframe: 0 };
const dimensions = await localImageDimensions();
for (const file of (await listFiles(distDirectory)).filter((path) => extname(path) === '.html')) {
  const relativePath = relative(distDirectory, file);
  if (relativePath.split(sep)[0] === 'demos') continue;

  const source = await readFile(file, 'utf8');
  const optimized = addMediaDefaults(source, counters, dimensions);
  if (optimized !== source) await writeFile(file, optimized);
}

console.log(`Static media optimized: ${counters.img} image tag(s), ${counters.iframe} iframe tag(s).`);
