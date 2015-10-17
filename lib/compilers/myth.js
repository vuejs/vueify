var options = require('./options')

module.exports = function (raw, cb) {
  try {
    var myth = require('myth')
  } catch (err) {
    return cb(err)
  }
  try {
    var css = myth(raw, options || {})
  } catch (err) {
    return cb(err)
  }
  cb(null, css)
}
