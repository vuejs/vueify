var options = require('./options')

module.exports = function (raw, cb) {
  try {
    var stylus = require('stylus')
  } catch (err) {
    return cb(err)
  }
  stylus.render(raw, options.stylus || {}, cb)
}
