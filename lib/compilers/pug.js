var options = require('./options')

module.exports = function (raw, cb) {
  try {
    var pug = require('pug')
  } catch (err) {
    return cb(err)
  }
  try {
    var html = pug.compile(raw, options.pug || {})()
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
