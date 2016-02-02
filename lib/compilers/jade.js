var options = require('./options')

module.exports = function (raw, cb) {
  try {
    var jade = require('jade')
  } catch (err) {
    return cb(err)
  }
  try {
    var html = jade.compile(raw, options.jade || {})()
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
