var fs = require('fs')
var compiler = require('../lib/compiler')

module.exports = function (b, opts) {
  compiler.applyConfig({
    extractCSS: true
  })

  var styles = Object.create(null)
  var outPath = opts.out || opts.o || 'bundle.css'
  if (typeof outPath === 'function') {
    outPath = outPath()
  }

  b.on('bundle', function (bs) {
    bs.on('end', function () {
      fs.writeFile(outPath, Object.keys(styles)
        .map(function (file) { return styles[file] })
        .join('\n'))
    })
  })

  b.on('reset', listen)
  listen()

  function listen () {
    b.on('transform', function (tr, file) {
      if (tr.vueify) {
        tr.on('vueify-style', function (e) {
          styles[e.file] = e.style
        })
      }
    })
  }
}
