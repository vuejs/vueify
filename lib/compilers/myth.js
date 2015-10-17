module.exports = function (raw, cb) {
  try {
    var myth = require('myth')
  } catch (err) {
    return cb(err)
  }
  try {
    var css = myth(raw)
  } catch (err) {
    return cb(err)
  }
  cb(null, css)
}
