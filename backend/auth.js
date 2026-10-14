const crypto = require('node:crypto')

const secret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex')
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || '').split(':')
  if (!salt || !expected) return false
  const actual = crypto.scryptSync(password, salt, 64)
  const expectedBuffer = Buffer.from(expected, 'hex')
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer)
}

function createToken(user) {
  const payload = encode({ id: user.id, comercio_id: user.comercio_id, usuario: user.usuario, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function authenticate(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return res.status(401).json({ error: 'Iniciá sesión para administrar tus productos.' })
  const expected = crypto.createHmac('sha256', secret).update(payload).digest()
  let received
  try { received = Buffer.from(signature, 'base64url') } catch { return res.status(401).json({ error: 'La sesión no es válida.' }) }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return res.status(401).json({ error: 'La sesión no es válida.' })
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!Number.isInteger(user.id) || !Number.isInteger(user.comercio_id) || user.exp < Date.now()) throw new Error('expired')
    req.user = user
    next()
  } catch { return res.status(401).json({ error: 'La sesión venció. Iniciá sesión nuevamente.' }) }
}

module.exports = { hashPassword, verifyPassword, createToken, authenticate }
