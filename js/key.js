const form = document.getElementById('form')
const out = document.getElementById('out')
const err = document.getElementById('err')
const messages = {
  404: 'No pre-order found for that email. If you think this is a mistake please check with "thefinalbacon" on discord or email cuberalted@gmail.com',
  429: 'Too many tries. Wait a minute and try again.'
}

form.onsubmit = async e => {
  e.preventDefault()
  err.hidden = true
  const res = await fetch(window.COVE.api + '/api/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: form.email.value })
  }).catch(() => null)

  if (!res || !res.ok) {
    err.textContent = res ? messages[res.status] || 'Something went wrong' : 'Could not reach the server'
    err.hidden = false
    return
  }

  const { key } = await res.json()
  document.getElementById('keyValue').textContent = key
  form.hidden = true
  out.hidden = false
}

document.getElementById('copy').onclick = e => {
  navigator.clipboard.writeText(document.getElementById('keyValue').textContent)
  e.target.textContent = 'Copied'
}
