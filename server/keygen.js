const path = require('path')
const keys = require('./keys')(path.join(__dirname, 'data'))

const [command, ...rest] = process.argv.slice(2)

if (command === 'buyer' && rest[0]) {
  console.log('added', keys.addBuyer(rest[0]))
} else if (command === 'claim' && rest[0]) {
  console.log(keys.claim(rest[0]) || 'no buyer with that email')
} else if (/^\d+$/.test(command || '1')) {
  const count = Number(command || 1)
  for (let i = 0; i < count; i++) console.log(keys.issue(rest.join(' ')))
} else {
  console.log('usage:\n  node server/keygen.js [count] [note]\n  node server/keygen.js buyer <email>\n  node server/keygen.js claim <email>')
}
