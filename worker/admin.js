const api = process.env.COVE_API
const token = process.env.ADMIN_TOKEN
const [command, ...rest] = process.argv.slice(2)

async function post(path, body) {
  const res = await fetch(api + path, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

if (!api || !token) {
  console.log('Set COVE_API and ADMIN_TOKEN first.')
} else if (command === 'key') {
  console.log((await post('/api/issue', { note: rest.join(' ') })).key)
} else if (command === 'last') {
  const res = await fetch(api + '/api/debug', { headers: { authorization: 'Bearer ' + token } })
  console.log(JSON.stringify(await res.json(), null, 2))
} else if (command === 'buyer' && rest[0]) {
  console.log(await post('/api/purchase', { email: rest[0] }))
} else {
  console.log('usage:\n  node admin.js key [note]\n  node admin.js buyer <email>\n  node admin.js last')
}
