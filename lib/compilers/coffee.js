var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb, compiler) {
  ensureRequire('coffee', ['coffee-script'])
  var coffee = require('coffee-script')
  try {
    var js = coffee.compile(raw, compiler.options.coffee || {
      bare: true
    })
  } catch (err) {
    return cb(err)
  }
  cb(null, js)
}
