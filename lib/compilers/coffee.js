var ensureRequire = require('../ensure-require.js')

module.exports = function (raw, cb, compiler) {
  ensureRequire('coffee', ['coffee-script'])
  var coffee = require('coffee-script')
  var compiled
  try {
    compiled = coffee.compile(raw, compiler.options.coffee || {
      bare: true,
      sourceMap: compiler.options.sourceMap
    })
  } catch (err) {
    return cb(err)
  }
  if (compiler.options.sourceMap) {
    compiled = {
      code: compiled.js,
      map: compiled.v3SourceMap
    }
  }
  cb(null, compiled)
}
