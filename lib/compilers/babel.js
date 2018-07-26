var fs = require('fs')
var path = require('path')
var json = require('json5')
var assign = require('object-assign')
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
    rc = json.parse(fs.readFileSync(babelRcPath, 'utf-8'))
  } catch (e) {
    throw new Error('[vueify] Your .babelrc seems to be incorrectly formatted.')
  }
  return rc
}

module.exports = function (raw, cb, compiler, filePath) {
  if ((compiler.options.babel || babelOptions) === defaultBabelOptions) {
    try {
      ensureRequire('babel', ['babel-preset-es2015', 'babel-runtime', 'babel-plugin-transform-runtime'])
    } catch (e) {
      console.error(e.message)
      console.error(
        '\n^^^ You are seeing this because you are using Vueify\'s default babel ' +
        'configuration. You can override this with .babelrc or the babel option ' +
        'in vue.config.js.'
      )
    }
  }

  try {
    var babel = require('babel-core')

    // browserify cli options
    var opts = compiler.options.babel;
    if (opts) {
      delete opts._;
      // "--opt [ a b ]" and "--opt a --opt b" are allowed:
      if (opts.ignore && opts.ignore._) opts.ignore = opts.ignore._;
      if (opts.only && opts.only._) opts.only = opts.only._;
      if (opts.plugins && opts.plugins._) opts.plugins = opts.plugins._;
      if (opts.presets && opts.presets._) opts.presets = opts.presets._;
    }

    var options = assign({
      comments: false,
      filename: filePath,
      sourceMaps: compiler.options.sourceMap
    }, compiler.options.babel || babelOptions)
    var res = babel.transform(raw, options)
  } catch (err) {
    return cb(err)
  }
  cb(null, res)
}
