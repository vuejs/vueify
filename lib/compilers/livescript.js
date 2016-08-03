var options = require('./options')

module.exports = function (raw, cb) {
  try {
    var ls = require('livescript')
  } catch (err) {
    return cb(err)
  }
  try {
    var js = ls.compile(raw, options.coffee || {})
  } catch (err) {
    return cb(err)
  }
  cb(null, js)
}
