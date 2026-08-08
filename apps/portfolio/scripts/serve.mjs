import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGzip } from 'node:zlib'

const distRoot = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const host = process.env.PORTFOLIO_HOST || process.env.HOST || '0.0.0.0'
const port = Number(process.env.PORTFOLIO_PORT || process.env.PORT || 4173)

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const compressibleExtensions = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt'])

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid portfolio port: ${port}`)
}

if (!existsSync(resolve(distRoot, 'index.html'))) {
  throw new Error('Portfolio build not found. Run pnpm build before pnpm start.')
}

function getFilePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://portfolio.local').pathname)
  const relativePath = pathname.replace(/^\/+/, '') || 'index.html'
  const candidate = resolve(distRoot, relativePath)
  const isInsideDist = candidate === distRoot || candidate.startsWith(`${distRoot}${sep}`)

  if (!isInsideDist) {
    return null
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate
  }

  if (relativePath.startsWith('assets/')) {
    return undefined
  }

  return resolve(distRoot, 'index.html')
}

function parseRange(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || '')
  if (!match) {
    return null
  }

  let start = match[1] ? Number(match[1]) : 0
  let end = match[2] ? Number(match[2]) : size - 1

  if (!match[1] && match[2]) {
    const suffixLength = Number(match[2])
    start = Math.max(size - suffixLength, 0)
    end = size - 1
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return null
  }

  return { start, end: Math.min(end, size - 1) }
}

const server = createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400).end('Bad Request')
    return
  }

  if (request.url === '/healthz') {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    })
    response.end(JSON.stringify({ status: 'ok' }))
    return
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method Not Allowed')
    return
  }

  let filePath
  try {
    filePath = getFilePath(request.url)
  } catch {
    response.writeHead(400).end('Bad Request')
    return
  }

  if (filePath === null) {
    response.writeHead(403).end('Forbidden')
    return
  }

  if (!filePath) {
    response.writeHead(404).end('Not Found')
    return
  }

  const stats = statSync(filePath)
  const extension = extname(filePath).toLowerCase()
  const requestPath = new URL(request.url, 'http://portfolio.local').pathname
  const isHashedAsset = requestPath.startsWith('/assets/')
  const range = parseRange(request.headers.range, stats.size)
  const commonHeaders = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': isHashedAsset
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
  }

  if (range) {
    response.writeHead(206, {
      ...commonHeaders,
      'Content-Length': range.end - range.start + 1,
      'Content-Range': `bytes ${range.start}-${range.end}/${stats.size}`,
    })
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    createReadStream(filePath, range).pipe(response)
    return
  }

  const acceptsGzip = /\bgzip\b/.test(request.headers['accept-encoding'] || '')
  const shouldGzip = acceptsGzip && stats.size > 1024 && compressibleExtensions.has(extension)

  response.writeHead(200, {
    ...commonHeaders,
    ...(shouldGzip
      ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }
      : { 'Content-Length': stats.size }),
  })

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  const stream = createReadStream(filePath)
  stream.on('error', () => {
    if (!response.headersSent) {
      response.writeHead(500)
    }
    response.end()
  })

  if (shouldGzip) {
    stream.pipe(createGzip({ level: 6 })).pipe(response)
  } else {
    stream.pipe(response)
  }
})

server.listen(port, host, () => {
  console.log(`Portfolio server listening on http://${host}:${port}`)
})
