var through = require('through')
var compiler = require('vue-component-compiler')

module.exports = function vueify (file) {
  if (!/.vue$/.test(file)) return through()
  var data = ''
  var stream = through(write, end)

  function write(buf) {
    data += buf
  }

  function end () {
    compiler.compile(data, file, function(error, result) {
      if (error) stream.emit('error', error)
      stream.queue(result)
      stream.queue(null)
    })
  }

  return stream
}