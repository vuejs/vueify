var fs = require('fs')
var path = require('path')
var options = require('./options')
var ensureRequire = require('../ensure-require')

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

if (babelOptions === defaultBabelOptions) {
  ensureRequire('babel', ['babel-preset-es2015', 'babel-runtime', 'babel-plugin-transform-runtime'])
}

module.exports = function (raw, cb) {
  try {
    var babel = require('babel-core')
    var res = babel.transform(raw, options.babel || babelOptions)
  } catch (err) {
    return cb(err)
  }
  cb(null, res.code)
}
