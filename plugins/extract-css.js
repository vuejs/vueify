var fs = require('fs')
var compiler = require('../lib/compiler')

compiler.options.extractCSS = true

module.exports = function (b, opts) {
  var outPath = opts.out || opts.o || 'bundle.css'
  var styles = Object.create(null)

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
