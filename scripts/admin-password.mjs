// Prints the ADMIN_PASSWORD_HASH line for .env:   npm run admin:password
// The password is read from the terminal without echoing; it is never stored.
import { randomBytes, scryptSync } from 'node:crypto'
import { createInterface } from 'node:readline'

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) })
let hidden = false
rl._writeToOutput = (text) => {
  if (!hidden) rl.output.write(text)
}
const lines = rl[Symbol.asyncIterator]()

async function ask(question) {
  process.stdout.write(question)
  hidden = true
  const { value } = await lines.next()
  hidden = false
  process.stdout.write('\n')
  return value ?? ''
}

const password = await ask('New back office password (min. 12 characters): ')
const again = password.length >= 12 ? await ask('Repeat it: ') : ''
rl.close()

if (password.length < 12) {
  console.error('Too short.')
  process.exit(1)
}
if (password !== again) {
  console.error('The passwords differ.')
  process.exit(1)
}

// same parameters as src/lib/server/auth.ts
const salt = randomBytes(16)
const hash = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 })
console.log(`\nAdd this line to .env:\nADMIN_PASSWORD_HASH=scrypt:${salt.toString('hex')}:${hash.toString('hex')}`)
