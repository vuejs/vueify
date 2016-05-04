var options = require('./options')

module.exports = function (raw, cb) {
  try {
    var babel = require('babel-core')
    var res = babel.transform(raw, options.babel || {})
  } catch (err) {
    return cb(err)
  }
  cb(null, res.code)
}
