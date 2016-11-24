var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb) {
  ensureRequire('skip-compilers', [])
  cb(null, raw)
}
