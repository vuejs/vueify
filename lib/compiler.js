var fs = require('fs')
var path = require('path')
var chalk = require('chalk')
var hash = require('hash-sum')
var assign = require('object-assign')
var Emitter = require('events').EventEmitter
var vueCompiler = require('vue-template-compiler')
var sourceMap = require('source-map')
var convert = require('convert-source-map')

var genId = require('./gen-id')
var normalize = require('./normalize')
var compilers = require('./compilers')
var rewriteStyle = require('./style-rewriter')

// determine dynamic script paths
var hotReloadAPIPath = 'vue-hot-reload-api' //normalize.dep('vue-hot-reload-api')
var insertCSSPath = normalize.lib('insert-css')

var hasBabel = true
try {
  require('babel-core')
} catch (e) {
  hasBabel = false
}

var splitRE = /\r?\n/g
var resolvedPartsCache = Object.create(null)

// expose compiler
var compiler = module.exports = new Emitter()
compiler.setMaxListeners(Infinity)

// options
var options = compiler.options = {}

// load user config
compiler.loadConfig = function () {
  var fs = require('fs')
  var path = require('path')
  var configPath = path.resolve(process.cwd(), 'vue.config.js')
  if (fs.existsSync(configPath)) {
    compiler.applyConfig(require(configPath))
  }
}

// apply config
compiler.applyConfig = function (config) {
  // copy user options to default options
  Object.keys(config).forEach(function (key) {
    if (key !== 'customCompilers') {
      options[key] = config[key]
    } else {
      // register compilers
      Object.keys(config[key]).forEach(function (name) {
        compilers[name] = config[key][name]
      })
    }
  })
}

compiler.compile = function (content, filePath, cb) {
  // generate css scope id
  var id = 'data-v-' + genId(filePath)
  // parse the component into parts
  var parts = vueCompiler.parseComponent(content)

  // check for scoped style nodes
  var hasScopedStyle = parts.styles.some(function (style) {
    return style.scoped
  })

  var resolvedParts = {
    template: null,
    script: null,
    styles: []
  }

  Promise.all([
    processTemplate(parts.template, filePath, resolvedParts),
    processScript(parts.script, filePath, resolvedParts)
  ].concat(parts.styles.map(function (style) {
    return processStyle(style, filePath, id, resolvedParts)
  })))
  .then(mergeParts)
  .catch(cb)

  function mergeParts () {
    // check whether script/template has changed
    var prevParts = resolvedPartsCache[id] || {}
    resolvedPartsCache[id] = resolvedParts
    var scriptChanged = resolvedParts.script !== prevParts.script
    var templateChanged = resolvedParts.template !== prevParts.template

    var output = ''
    var map = null
    // styles
    var style = resolvedParts.styles.join('\n')
    if (style) {
      // emit style
      compiler.emit('style', {
        file: filePath,
        style: style
      })
      if (!options.extractCSS) {
        style = JSON.stringify(style)
        output +=
          'var __vueify_style_dispose__ = require("' + insertCSSPath + '").insert(' + style + ')\n'
      }
    }
    // script
    var script = resolvedParts.script
    if (script) {
      if (options.sourceMap) {
        map = generateSourceMap(script, output)
      }
      output +=
        ';(function(){\n' + script + '\n})()\n' +
        // babel 6 compat
        'if (module.exports.__esModule) module.exports = module.exports.default\n'
    }
    // in case the user exports with Vue.extend
    output += 'var __vue__options__ = (typeof module.exports === "function"' +
      '? module.exports.options' +
      ': module.exports)\n'
    // template
    var template = resolvedParts.template
    if (template) {
      output +=
        '__vue__options__.render = ' + template.render + '\n' +
        '__vue__options__.staticRenderFns = ' + template.staticRenderFns + '\n'
    }
    // scoped CSS id
    if (hasScopedStyle) {
      output += '__vue__options__._scopeId = "' + id + '"\n'
    }
    // hot reload
    if (process.env.NODE_ENV !== 'production' && !process.env.VUEIFY_TEST) {
      output +=
        'if (module.hot) {(function () {' +
        '  var hotAPI = require("' + hotReloadAPIPath + '")\n' +
        '  hotAPI.install(require("vue"), true)\n' +
        '  if (!hotAPI.compatible) return\n' +
        '  module.hot.accept()\n' +
        // remove style tag on dispose
        (style && !options.extractCSS
          ? '  module.hot.dispose(__vueify_style_dispose__)\n'
          : '') +
        '  if (!module.hot.data) {\n' +
        // initial insert
        '    hotAPI.createRecord("' + id + '", __vue__options__)\n' +
        '  } else {\n' +
        // update
          (scriptChanged
            ? '    hotAPI.reload("' + id + '", __vue__options__)\n'
            : templateChanged
              ? '    hotAPI.rerender("' + id + '", __vue__options__)\n'
              : ''
          ) +
        '  }\n' +
        '})()}'
    }
    if (map) {
      output += '\n' + convert.fromJSON(map.toString()).toComment()
    }
    cb(null, output)
  }

  function generateSourceMap (script, output) {
    // hot-reload source map busting
    var hashedFilename = path.basename(filePath) + '?' + hash(filePath + content)
    var map = new sourceMap.SourceMapGenerator()
    map.setSourceContent(hashedFilename, content)
    // check input source map from babel/coffee etc
    var inMap = resolvedParts.map
    var inMapConsumer = inMap && new sourceMap.SourceMapConsumer(inMap)
    var generatedOffset = (output ? output.split(splitRE).length : 0) + 1
    var originalOffset = content.slice(0, parts.script.start).split(splitRE).length - 1
    script.split(splitRE).forEach(function (line, index) {
      var ln = index + 1
      var originalLine = inMapConsumer
        ? inMapConsumer.originalPositionFor({
            line: ln,
            column: 0
          }).line
        : ln
      if (originalLine) {
        map.addMapping({
          source: hashedFilename,
          generated: {
            line: ln + generatedOffset,
            column: 0
          },
          original: {
            line: originalLine + originalOffset,
            column: 0
          }
        })
      }
    })
    return map
  }
}

function processTemplate (part, filePath, parts) {
  if (!part) return Promise.resolve()
  var template = getContent(part, filePath)
  return compileAsPromise('template', template, part.lang, filePath)
    .then(function (res) {
      var compiled = vueCompiler.compile(res)
      if (compiled.errors.length) {
        compiled.errors.forEach(function (msg) {
          console.error('\n' + chalk.red(msg) + '\n')
        })
        throw new Error('Vue template compilation failed')
      } else {
        parts.template = {
          render: toFunction(compiled.render),
          staticRenderFns: '[' + compiled.staticRenderFns.map(toFunction).join(',') + ']'
        }
      }
    })
}

function processScript (part, filePath, parts) {
  if (!part) return Promise.resolve()
  var lang = part.lang || (hasBabel ? 'babel' : null)
  var script = getContent(part, filePath)
  return compileAsPromise('script', script, lang, filePath)
    .then(function (res) {
      if (typeof res === 'string') {
        parts.script = res
      } else {
        parts.script = res.code
        parts.map = res.map
      }
    })
}

function processStyle (part, filePath, id, parts) {
  var style = getContent(part, filePath)
  return compileAsPromise('style', style, part.lang, filePath)
    .then(function (res) {
      return rewriteStyle(id, res, part.scoped, options).then(function (res) {
        parts.styles.push(res)
      })
    })
}

function getContent (part, filePath) {
  return part.src
    ? loadSrc(part.src, filePath)
    : part.content
}

function loadSrc (src, filePath) {
  var dir = path.dirname(filePath)
  var filePath = path.resolve(dir, src)
  compiler.emit('dependency', filePath)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (e) {
    console.error(chalk.red(
      'Failed to load src: "' + src +
      '" from file: "' + filePath + '"'
    ))
  }
}

function compileAsPromise (type, source, lang, filePath) {
  var compile = compilers[lang]
  if (compile) {
    return new Promise(function (resolve, reject) {
      compile(source, function (err, res) {
        if (err) {
          // report babel error codeframe
          if (err.codeFrame) {
            process.nextTick(function () {
              console.error(err.codeFrame)
            })
          }
          return reject(err)
        }
        resolve(res)
      }, compiler, filePath)
    })
  } else {
    return Promise.resolve(source)
  }
}

function toFunction (code) {
  return 'function(){' + code + '}'
}
