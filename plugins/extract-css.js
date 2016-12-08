var fs = require('fs')
var compiler = require('../lib/compiler')

module.exports = function (b, opts) {
  compiler.applyConfig({
    extractCSS: true
  })

  var styles = Object.create(null)
  var outPath = opts.out || opts.o || 'bundle.css'

  b.on('bundle', function (bs) {
    bs.on('end', function () {
      var css = Object.keys(styles)
        .map(function (file) { return styles[file] })
        .join('\n')
      if (typeof outPath === 'object' && outPath.write) {
        outPath.write(css)
        outPath.end()
      } else if (typeof outPath === 'string') {
        fs.writeFile(outPath, css, function () {})
      }
    })
  })

  b.on('transform', function (tr, file) {
    if (tr.vueify) {
      tr.on('vueify-style', function (e) {
        styles[e.file] = e.style
      })
    }
  })
}
