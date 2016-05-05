var options = require('./options')
var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb) {
  ensureRequire('babel',['babel-core','babel-preset-es2015','babel-plugin-transform-runtime',['babel-runtime/core-js.js','babel-runtime']])
  try {
    var babel = require('babel-core')
    var res = babel.transform(raw, options.babel || {})
  } catch (err) {
    return cb(err)
  }
  cb(null, res.code)
}
