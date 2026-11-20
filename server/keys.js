const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const part = n => Array.from(crypto.randomBytes(n), b => alphabet[b % alphabet.length]).join('')

module.exports = dir => {
  const file = name => path.join(dir, name)
  const load = (name, fallback) => (fs.existsSync(file(name)) ? JSON.parse(fs.readFileSync(file(name), 'utf8')) : fallback)
  const save = (name, value) => fs.writeFileSync(file(name), JSON.stringify(value, null, 2))

  return {
    issue(note) {
      const keys = load('keys.json', {})
      let key
      do key = `${part(4)}-${part(3)}-${part(4)}`
      while (keys[key])
      keys[key] = { note: note || '', created: new Date().toISOString() }
      save('keys.json', keys)
      return key
    },
    addBuyer(email) {
      const buyers = load('purchases.json', {})
      const id = email.trim().toLowerCase()
      if (!buyers[id]) buyers[id] = { key: null, added: new Date().toISOString() }
      save('purchases.json', buyers)
      return id
    },
    claim(email) {
      const buyers = load('purchases.json', {})
      const id = String(email || '').trim().toLowerCase()
      if (!buyers[id]) return null
      if (!buyers[id].key) {
        buyers[id].key = this.issue(id)
        save('purchases.json', buyers)
      }
      return buyers[id].key
    },
    valid: key => Boolean(load('keys.json', {})[key]),
    released: () => load('config.json', {}).released === true
  }
}
