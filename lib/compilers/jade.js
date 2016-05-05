var options = require('./options')
var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb) {
  ensureRequire('jade','jade')
  var jade = require('jade')
  try {
    var html = jade.compile(raw, options.jade || {})()
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
