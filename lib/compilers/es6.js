module.exports = function (raw, cb) {
  try {
    var babel = require('babel')
  } catch (err) {
    return cb(err)
  }
  try {
    var res = babel.transform(raw, {
      loose: 'all',
      optional: ['runtime']
    })
  } catch (err) {
    return cb(err)
  }
  cb(null, res.code)
}
