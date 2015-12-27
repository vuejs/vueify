var fs = require('fs')
var path = require('path')

var defaultBabelOptions = {
  presets: ['es2015'],
  plugins: ['transform-runtime']
}

var babelRcPath = path.resolve(process.cwd(), '.babelrc')
var babelOptions = fs.existsSync(babelRcPath)
  ? getBabelRc() || defaultBabelOptions
  : defaultBabelOptions

function getBabelRc () {
  var rc
  try {
    rc = JSON.parse(fs.readFileSync(babelRcPath, 'utf-8'))
  } catch (e) {
    throw new Error('[vueify] Your .babelrc seems to be incorrectly formatted.')
  }
  return rc
}

module.exports = {
  autoprefixer: {
    remove: false
  },
  babel: babelOptions,
  coffee: {
    bare: true
  },
  sass: {
    sourceComments: true
  }
}
