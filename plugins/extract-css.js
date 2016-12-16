var fs = require('fs')
var compiler = require('../lib/compiler')

module.exports = function (b, opts) {
  compiler.applyConfig({
    extractCSS: true
  })

  var styles = Object.create(null)
  var outCallback = opts.callback || opts.c || false
  var outPath = opts.out || opts.o || (outCallback ? undefined : 'bundle.css')

  b.on('bundle', function (bs) {
    bs.on('end', function () {
      var css = Object.keys(styles)
        .map(function (file) { return styles[file] })
        .join('\n')
      var callback = function () {
        if(typeof outCallback === 'function') {
          outCallback(css)
        }
      }

      if (typeof outPath === 'object' && outPath.write) {
        outPath.end(css, callback)
      } else if (typeof outPath === 'string') {
        fs.writeFile(outPath, css, callback)
      } else {
        callback()
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
