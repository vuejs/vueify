module.exports = function (raw, cb) {
  try {
    var coffee = require('coffee-script')
  } catch (err) {
    return cb(err)
  }
  try {
    var js = coffee.compile(raw, {
      bare: true
    })
  } catch (err) {
    return cb(err)
  }
  cb(null, js)
}