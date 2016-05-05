var options = require('./options')
var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb) {
  ensureRequire('coffee',['coffee-script'])
  var coffee = require('coffee-script')
  try {
    var js = coffee.compile(raw, options.coffee || {})
  } catch (err) {
    return cb(err)
  }
  cb(null, js)
}
