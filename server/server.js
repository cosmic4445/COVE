const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const keysFor = require('./keys')

const root = path.join(__dirname, '..')
const port = process.env.PORT || 3000
const admin = process.env.ADMIN_TOKEN || ''
const keys = keysFor(path.join(__dirname, 'data'))
const hits = new Map()

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }
const pages = { '/': '/index.html', '/key': '/key.html' }
const folders = ['/css/', '/js/', '/assets/']

function limited(req, limit) {
  const id = req.socket.remoteAddress + req.url
  const now = Date.now()
  const recent = (hits.get(id) || []).filter(t => now - t < 60000)
  recent.push(now)
  hits.set(id, recent)
  return recent.length > limit
}

function authorized(req) {
  const given = Buffer.from((req.headers.authorization || '').replace(/^Bearer /, ''))
  const wanted = Buffer.from(admin)
  return admin !== '' && given.length === wanted.length && crypto.timingSafeEqual(given, wanted)
}

function read(req) {
  return new Promise(resolve => {
    let data = ''
    req.on('data', c => {
      if (data.length < 4096) data += c
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

function serve(req, res) {
  const url = pages[req.url.split('?')[0]] || req.url.split('?')[0]
  const file = path.join(root, url)
  const rel = '/' + path.relative(root, file).split(path.sep).join('/')
  const allowed = Object.values(pages).includes(rel) || folders.some(f => rel.startsWith(f))
  if (!allowed || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, 404, { error: 'not found' })
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}

const server = http
  .createServer(async (req, res) => {
    if (req.method === 'GET' && !req.url.startsWith('/api/')) return serve(req, res)
    if (req.method === 'GET' && req.url === '/api/status') return json(res, 200, { released: keys.released() })

    if (req.method !== 'POST') return json(res, 404, { error: 'not found' })

    if (req.url === '/api/verify') {
      if (limited(req, 30)) return json(res, 429, { error: 'slow down' })
      const { key } = await read(req)
      return json(res, 200, { valid: keys.valid(key), released: keys.released() })
    }

    if (req.url === '/api/claim') {
      if (limited(req, 8)) return json(res, 429, { error: 'slow down' })
      const { email } = await read(req)
      const key = keys.claim(email)
      return key ? json(res, 200, { key }) : json(res, 404, { error: 'no purchase found' })
    }

    if (req.url === '/api/issue' || req.url === '/api/purchase') {
      if (!authorized(req)) return json(res, 401, { error: 'unauthorized' })
      const body = await read(req)
      if (req.url === '/api/issue') return json(res, 200, { key: keys.issue(body.note) })
      if (!body.email) return json(res, 400, { error: 'email required' })
      return json(res, 200, { email: keys.addBuyer(body.email) })
    }

    json(res, 404, { error: 'not found' })
  })

server.on('error', e => {
  if (e.code !== 'EADDRINUSE') throw e
  console.error(`Port ${port} is already in use. Close whatever is using it, or pick another port:`)
  console.error(`  PowerShell:  $env:PORT=3001; npm start`)
  console.error(`  Mac/Linux:   PORT=3001 npm start`)
  process.exit(1)
})

server.listen(port, () => console.log(`Cove site running at http://localhost:${port}`))
