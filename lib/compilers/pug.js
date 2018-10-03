var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb, compiler, filePath) {
  ensureRequire('pug', 'pug')
  var pug = require('pug')
  try {
    var defaultOptions = {
      filename: filePath
    }
    var html = pug.compile(
      raw,
      Object.assign({}, compiler.options.pug || {}, defaultOptions)
    )()
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
