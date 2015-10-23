var options = require('./options')

// built-in compilers
var compilers = module.exports = {
  script: {
    coffee: require('./coffee'),
    babel: require('./babel'),
    // backwards compat
    es: require('./babel')
  },
  style: {
    less: require('./less'),
    sass: require('./sass'),
    scss: require('./sass'),
    stylus: require('./stylus'),
    myth: require('./myth')
  },
  template: {
    jade: require('./jade')
  }
}

/**
 * Register a custom pre-processor for a given language.
 *
 * @param {Object} opts
 *                 - lang {String}
 *                 - type {String}
 *                 - compile {Function}
 */
compilers.register = function registerCompiler (opts) {
  if (!opts.lang) {
    return warn('missing language')
  }
  if (!opts.type) {
    return warn('missing file type')
  }
  if (!opts.compile || typeof opts.compile !== 'function') {
    return warn('missing compile function')
  }
  if (!compilers[opts.type]) {
    return warn(
      'invalid file type: ' + opts.type +
      ' (valid types: script|style|template)'
    )
  }
  compilers[opts.type][opts.lang] = opts.compile
}

// check for config file
compilers.loadConfig = function () {
  var fs = require('fs')
  var path = require('path')
  var configPath = path.resolve(process.cwd(), 'vue.config.js')
  if (fs.existsSync(configPath)) {
    require(configPath)({
      register: compilers.register,
      option: function (name, opts) {
        options[name] = opts
      }
    })
  }
}

function warn (msg) {
  console.warn(
    '[vue-component-compiler] Error attempting to' +
    'register custom compiler: ' + msg
  )
}
