var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb, compiler) {
  ensureRequire('pug', 'pug')
  var pug = require('pug')
  try {
    var html = pug.compile(raw, compiler.options.pug || {})()
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
