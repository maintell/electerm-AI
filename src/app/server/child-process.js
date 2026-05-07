/**
 * run server in child process
 *
 */

const { fork } = require('child_process')
const { resolve } = require('path')
const log = require('../common/log')

// --use-system-ca is supported since Node.js 24.3.0
function supportsSystemCa () {
  const [major, minor] = process.versions.node.split('.').map(Number)
  return major > 24 || (major === 24 && minor >= 3)
}

module.exports = (config, env, sysLocale) => {
  const nodeOpts = [env.NODE_OPTIONS, supportsSystemCa() ? '--use-system-ca' : '']
    .filter(Boolean).join(' ').trim()

  // start server
  const child = fork(resolve(__dirname, './server.js'), {
    env: Object.assign(
      {
        LANG: `${sysLocale.replace(/-/, '_')}.UTF-8`,
        electermPort: config.port,
        electermHost: config.host,
        requireAuth: config.requireAuth || '',
        tokenElecterm: config.tokenElecterm,
        sshKeysPath: env.sshKeysPath,
        NODE_OPTIONS: nodeOpts || undefined
      },
      env
    ),
    cwd: process.cwd()
  }, (error, stdout, stderr) => {
    if (error || stderr) {
      throw error || stderr
    }
    log.info(stdout)
  })
  return child
}
