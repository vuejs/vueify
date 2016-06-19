var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb, compiler) {
  ensureRequire('jade', 'jade')
  var jade = require('jade')
  try {
    var html = jade.compile(raw, compiler.options.jade || {})()
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
