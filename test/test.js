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

    // test registering dependency
    var deps = []
    function addDep (file) {
      deps.push(file)
    }
    compiler.on('dependency', addDep)

    process.env.VUEIFY_TEST = true
    process.env.NODE_ENV = name === 'non-minified'
      ? 'development'
      : 'production'

    compiler.compile(
      fileContent,
      path.resolve(__dirname, filePath),
      function (err, result) {
        // the cb is handled by a Promise, so the assertion
        // errors gets swallowed and the test never fails.
        // do it in a separate tick.
        setTimeout(function () {
          if (err) throw err
          assert.equal(result, expected, 'should compile correctly')

          // check src
          if (name === 'src') {
            assert.equal(deps[0], __dirname + '/fixtures/test.html')
            assert.equal(deps[1], __dirname + '/fixtures/test.styl')
            assert.equal(deps[2], __dirname + '/fixtures/src/test.js')
          }

          if (name === 'less' || name === 'sass' || name === 'styl') {
            assert.equal(deps[0], __dirname + '/fixtures/imports/import.' + name)
          }

          compiler.removeListener('dependency', addDep)
          done()
        }, 0)
      }
    )
  })
}

describe('Vueify compiler', function () {
  fs.readdirSync(path.resolve(__dirname, 'expects'))
    .forEach(function (file) {
      test(path.basename(file, '.js'))
    })
  it('missing dependencies', function(done) {
    var rewire = require('rewire')
    var ensureRequire = rewire('../lib/ensure-require.js')
    ensureRequire.__set__('require.resolve',function(){throw new Error()})
    compiler = rewire('../lib/compiler')
    compiler.__set__('ensureRequire',ensureRequire)
    compiler.compile('<template></template><script></script><style>a{font-size:20px}</style>', function (err,result) {
      assert.equal(err.message,'You are trying to use "styles". vueify-insert-css is missing.\n\nTo install run:\nnpm install --save-dev vueify-insert-css')
      done()
    })
  })
})
