var options = require('./options')
var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb) {
  ensureRequire('pug','pug')
  var pug = require('pug')
  try {
    var html = pug.compile(raw, options.pug || {})()
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
