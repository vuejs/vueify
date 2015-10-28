var fs = require('fs')
var path = require('path')
var compiler = require('../lib/compiler')
var assert = require('assert')
var hash = require('hash-sum')

// test custom transform
compiler.applyConfig({
  customCompilers: {
    test: function (content, cb) {
      content = content.replace('not ', '')
      cb(null, content)
    }
  }
})

function read (file) {
  return fs.readFileSync(path.resolve(__dirname, file), 'utf-8')
}

function test (name) {
  it(name, function (done) {
    var filePath = 'fixtures/' + name + '.vue'
    var fileContent = read(filePath)
    var expected = read('expects/' + name + '.js')
      .replace(/\{\{id\}\}/g, '_v-' + hash(require.resolve('./' + filePath)))

    // test src imports registering dependency
    var addDep
    var deps
    if (name === 'src') {
      deps = []
      addDep = function (file) {
        deps.push(file)
      }
      compiler.on('dependency', addDep)
    }

    process.env.VUEIFY_TEST = true
    process.env.NODE_ENV = name === 'non-minified'
      ? 'development'
      : 'production'

    compiler.compile(
      fileContent,
      path.resolve(__dirname, filePath),
      function (err, result) {
        assert(!err)
        try {
          assert.equal(result, expected)
        } catch (e) {
          console.log('expected:\n\n' + expected + '\n')
          console.log('result:\n\n' + result + '\n')
          assert(!e)
        }

        if (name === 'src') {
          compiler.removeListener('dependency', addDep)
          assert.equal(deps[0], __dirname + '/fixtures/test.html')
          assert.equal(deps[1], __dirname + '/fixtures/test.styl')
          assert.equal(deps[2], __dirname + '/fixtures/src/test.js')
        }
        
        done()
      }
    )
  })
}

describe('Vueify compiler', function () {
  fs.readdirSync(path.resolve(__dirname, 'expects'))
    .forEach(function (file) {
      test(path.basename(file, '.js'))
    })
})
