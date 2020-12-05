#!/usr/bin/env node
/* eslint-disable no-console */

const { Server } = require('../src/Server')

function cli (cmmds, argv = process.argv.slice(2)) {
  const cmd = { helptext: '\n    Usage: sider-mem [options]\n\n' }
  const map = Object.entries(cmmds).reduce((o, [key, vals]) => {
    const [short, long, shift, help, def] = vals
    cmd.helptext += `    ${String(short).padEnd(2)}, ${String(long).padEnd(10)} ${(shift || '').padEnd(10)} ${help}\n`
    if (def) cmd[key] = def
    o[short] = o[long] = () => {
      cmd[key] = shift ? argv.shift() : true
    }
    return o
  }, {})
  while (argv.length) {
    const arg = argv.shift()
    const found = map[arg]
    if (found) {
      cmd.hasArgs = true
      found()
    } else {
      cmd.args = (cmd.args || []).concat(arg)
    }
  }
  return cmd
}

const cmmds = {
  //     short, long, args, helptext, default value
  help: ['-h', '--help', false, 'this help'],
  port: ['-p', '--port', 'string', 'port the server listens on', 6379],
  host: ['', '--host', 'string', 'host', '127.0.0.1'],
  username: ['', '--username', 'string', 'username'],
  password: ['', '--password', 'string', 'password']
}

async function main () {
  const { PORT, HOST, USERNAME, PASSWORD } = process.env
  const options = {
    port: PORT,
    host: HOST,
    username: USERNAME,
    password: PASSWORD,
    ...cli(cmmds)
  }
  if (options.help) {
    console.log(options.helptext)
    return
  }

  const { username, password, host, port } = options
  const server = new Server({ username, password })
  await server.listen({ host, port })
}

main().catch(console.error)
