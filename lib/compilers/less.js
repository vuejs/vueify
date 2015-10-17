module.exports = function (raw, cb) {
  try {
    var less = require('less')
  } catch (err) {
    return cb(err)
  }
  less.render(raw, function (err, res) {
    // Less 2.0 returns an object instead rendered string
    if (typeof res === 'object') {
      res = res.css
    }
    cb(err, res)
  })
}