var options = require('./options')

module.exports = function (raw, cb) {
  try {
    var babel = require('babel')
  } catch (err) {
    return cb(err)
  }
  try {
    var res = babel.transform(raw, options.es || {})
  } catch (err) {
    return cb(err)
  }
  cb(null, res.code)
}
