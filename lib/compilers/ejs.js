var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb, compiler) {
  ensureRequire('ejs', 'ejs')
  var ejs = require('ejs')
  try {
    var html = ejs.render(raw, compiler.options.ejs || {})
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
