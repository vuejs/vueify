process.env.NODE_ENV = 'production'

var fs = require('fs')
var compiler = require('./lib/compiler')
var file = fs.readFileSync('./test/fixtures/scoped.vue', 'utf-8')
compiler.compile(file, function (err, res) {
  console.log(res)
})
