const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const part = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => alphabet[b % alphabet.length]).join('')

const headers = env => ({
  'access-control-allow-origin': env.ALLOW_ORIGIN || '*',
  'access-control-allow-headers': 'content-type, authorization',
  vary: 'origin'
})

const json = (env, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers(env), 'content-type': 'application/json' } })

function same(a, b) {
  if (!b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function issue(env, note) {
  let key
  do key = `${part(4)}-${part(3)}-${part(4)}`
  while (await env.KV.get('key:' + key))
  await env.KV.put('key:' + key, JSON.stringify({ note: note || '', created: new Date().toISOString() }))
  return key
}

async function addBuyer(env, email) {
  const id = 'buyer:' + String(email).trim().toLowerCase()
  if (!(await env.KV.get(id))) await env.KV.put(id, JSON.stringify({ key: null, added: new Date().toISOString() }))
  return id.slice(6)
}

async function sign(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))
  return Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, '0')).join('')
}

async function webhook(request, env, reply) {
  const raw = await request.text()
  const given = (request.headers.get('x-signature-sha256') || request.headers.get('x-bmc-signature') || '')
    .replace(/^sha256=/, '')
    .toLowerCase()
  if (!env.BMC_SECRET || !same(given, await sign(env.BMC_SECRET, raw))) return reply({ error: 'bad signature' }, 401)

  await env.KV.put('debug:last', raw)
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return reply({ error: 'bad body' }, 400)
  }

  const data = payload.response || payload.data || payload
  const event = request.headers.get('x-bmc-event') || payload.type || ''
  const email = data.supporter_email || data.payer_email || data.email
  const amount = Number(data.total_amount || data.amount || 0)
  if (!email || /refund|cancel|revoke/i.test(event) || amount < Number(env.MIN_AMOUNT || 0)) return reply({ ignored: true })

  await addBuyer(env, email)
  return reply({ ok: true })
}

function authorized(request, env) {
  return same((request.headers.get('authorization') || '').replace(/^Bearer /, ''), env.ADMIN_TOKEN)
}

async function claim(env, email) {
  const id = 'buyer:' + String(email || '').trim().toLowerCase()
  const buyer = JSON.parse((await env.KV.get(id)) || 'null')
  if (!buyer) return null
  if (!buyer.key) {
    buyer.key = await issue(env, id)
    await env.KV.put(id, JSON.stringify(buyer))
  }
  return buyer.key
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    const reply = (body, status) => json(env, body, status)
    const released = env.RELEASED === 'true'

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(env) })
    if (request.method === 'GET' && pathname === '/api/status') return reply({ released })
    if (request.method === 'GET' && pathname === '/api/debug') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      return reply({ last: JSON.parse((await env.KV.get('debug:last')) || 'null') })
    }
    if (request.method === 'POST' && pathname === '/webhook/bmc') return webhook(request, env, reply)
    if (request.method !== 'POST') return reply({ error: 'not found' }, 404)

    const body = await request.json().catch(() => ({}))

    if (pathname === '/api/verify') {
      const found = await env.KV.get('key:' + String(body.key || '').toUpperCase())
      return reply({ valid: found !== null, released })
    }

    if (pathname === '/api/claim') {
      const key = await claim(env, body.email)
      return key ? reply({ key }) : reply({ error: 'no purchase found' }, 404)
    }

    if (pathname === '/api/issue' || pathname === '/api/purchase') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      if (pathname === '/api/issue') return reply({ key: await issue(env, body.note) })
      if (!body.email) return reply({ error: 'email required' }, 400)
      return reply({ email: await addBuyer(env, body.email) })
    }

    return reply({ error: 'not found' }, 404)
  }
}
