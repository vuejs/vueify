var options = require('./options')
var assign = require('object-assign')
var path = require('path')

module.exports = function (raw, cb, compiler, filePath) {
  try {
    var sass = require('node-sass')
  } catch (err) {
    return cb(err)
  }

  var sassOptions = assign({
    data: raw,
    success: function (res) {
      if (typeof res === 'object') {
        cb(null, res.css)
      } else {
        cb(null, res) // compat for node-sass < 2.0.0
      }
    },
    error: function (err) {
      cb(err)
    }
  }, options.sass)

  var dir = path.dirname(filePath)
  var paths = [dir, process.cwd()]
  sassOptions.includePaths = sassOptions.includePaths
    ? sassOptions.includePaths.concat(paths)
    : paths

  sass.render(
    sassOptions,
    // callback for node-sass > 3.0.0
    function (err, res) {
      if (err) {
        cb(err)
      } else {
        res.stats.includedFiles.forEach(function(file){
          compiler.emit('dependency', file)
        })
        cb(null, res.css.toString())
      }
    }
  )
}
