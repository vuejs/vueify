var options = require('./options')
var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb) {
  ensureRequire('marko','marko')
  var marko = require('marko')
  var helpers = marko.helpers
  var templatePath = 'dummy.marko'
  var html
  try {
    var template = marko.load(templatePath, raw, {buffer: false})
    var rendered = template.render({})

    html = rendered.writer.str
    console.log(html)
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}
