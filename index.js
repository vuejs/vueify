var through = require('through')
var fs = require('fs')
var compiler = require('./lib/compiler')

var config = compiler.loadConfig()

if (config.cssExport) {
  fs.writeFile(config.cssExport, '')
}

module.exports = function vueify (file) {
  if (!/.vue$/.test(file)) return through()
  var data = ''
  var stream = through(write, end)

  function dependency(file) {
    stream.emit('file', file)
  }

  function style(buf) {
    if (config.cssExport) {
      fs.appendFile(config.cssExport, buf)
    }
  }
  
  function write(buf) {
    data += buf
  }

  function end () {
    stream.emit('file', file)
    compiler.on('dependency', dependency)
    compiler.on('style', style)

    compiler.compile(data, file, function(error, result) {
      compiler.removeListener('dependency', dependency)
      compiler.removeListener('style', style)
      if (error) stream.emit('error', error)
      stream.queue(result)
      stream.queue(null)
    })
  }

  return stream
}

// expose compiler
module.exports.compiler = compiler
