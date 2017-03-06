var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb, compiler) {
  ensureRequire('pug', 'pug')
  var pug = require('pug'),
    locals,
    options = compiler.options.pug || {};

  locals = options.data || {};

  try {
    var html = pug.compile(raw, options)(locals)
  } catch (err) {
    return cb(err)
  }
  cb(null, html)
}