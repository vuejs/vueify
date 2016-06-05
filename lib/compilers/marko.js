var options = require('./options')
var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb) {
  ensureRequire('marko','marko')
  var marko = require('marko')
  try {
    var template = marko.load('dummy.marko', raw, {buffer: false})
    var rendered = template.render({})
    var html = rendered.writer.str
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
