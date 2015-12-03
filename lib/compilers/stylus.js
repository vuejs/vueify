var options = require('./options')
var assign = require('object-assign')
var path = require('path')

module.exports = function (raw, cb, compiler, filePath) {
  try {
    var stylus = require('stylus')
  } catch (err) {
    return cb(err)
  }

  var dir = path.dirname(filePath)
  var paths = [dir, process.cwd()]
  paths = options.stylus && options.stylus.paths
    ? options.stylus.paths.concat(paths)
    : paths

  var renderer = stylus(raw)
    .set('filename', path.basename(filePath))
    .set('paths', paths)

  renderer.render(function (err, css) {
    if (err) return cb(err)
    renderer.deps().forEach(function (file) {
      compiler.emit('dependency', file)
    })
    cb(null, css)
  })
}
