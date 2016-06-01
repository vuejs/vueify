require('es6-promise').polyfill()
var fs = require('fs')
var path = require('path')
var parse5 = require('parse5')
var hash = require('hash-sum')
var compilers = require('./compilers')
var options = require('./compilers/options')
var rewriteStyle = require('./style-rewriter')
var rewriteTemplate = require('./template-rewriter')
var validateTemplate = require('vue-template-validator')
var chalk = require('chalk')
var assign = require('object-assign')
var deindent = require('de-indent')
var Emitter = require('events').EventEmitter

// determine hot-reload-api location
var hotReloadAPIPath = 'vue-hot-reload-api'
try {
  require(hotReloadAPIPath)
} catch (e) {
  // likely Npm 2.x
  hotReloadAPIPath = 'vueify/node_modules/vue-hot-reload-api'
}

var htmlMinifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true
}

// expose compiler
var compiler = module.exports = new Emitter()
compiler.setMaxListeners(Infinity)

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
    if (key === 'htmlMinifier') {
      if (process.env.NODE_ENV === 'production') {
        htmlMinifyOptions = assign(htmlMinifyOptions, config[key])
      }
    } else if (key !== 'customCompilers') {
      options[key] = config[key]
    } else {
      // register compilers
      Object.keys(config[key]).forEach(function (name) {
        compilers[name] = config[key][name]
      })
    }
  })
}

/**
 * Compile a .vue file.
 *
 * @param {String} content
 * @param {String} [filePath]
 * @param {Function} cb
 */
compiler.compile = function (content, filePath, cb) {
  // path is optional
  if (typeof filePath === 'function') {
    cb = filePath
    filePath = process.cwd()
  }

  // generate css scope id
  var id = '_v-' + hash(filePath || content)

  // parse the file into an HTML tree
  var fragment = parse5.parseFragment(content, { locationInfo: true })

  // check node numbers
  if (!validateNodeCount(fragment)) {
    return cb(new Error(
      'Only one script tag and one template tag allowed per *.vue file.'
    ))
  }

  // check for scoped style nodes
  var hasScopedStyle = fragment.childNodes.some(function (node) {
    return node.nodeName === 'style' && isScoped(node)
  })

  // Walk through the top level nodes and check for their
  // types & languages. If there are pre-processing needed,
  // push it into a jobs list.
  Promise.all(fragment.childNodes.map(function (node) {
    switch (node.nodeName) {
      case 'template':
        return processTemplate(node, filePath, id, hasScopedStyle, content)
      case 'style':
        return processStyle(node, filePath, id)
      case 'script':
        return processScript(node, filePath, content)
    }
  })
  .filter(function (p) { return p }))
  .then(mergeParts, cb)
  .catch(cb)

  function mergeParts (parts) {
    var output = ''
    // styles
    var style = extract(parts, 'style')
    if (style) {
      style = JSON.stringify(style)
      output +=
        'var __vueify_insert__ = require("vueify/lib/insert-css")\n' +
        'var __vueify_style__ = __vueify_insert__.insert(' + style + ')\n'
    }
    // script
    var script = extract(parts, 'script')
    if (script) {
      output +=
        script + '\n' +
        // babel 6 compat
        'if (module.exports.__esModule) module.exports = module.exports.default\n'
    }
    // template
    var template = extract(parts, 'template')
    if (template) {
      output +=
        ';(typeof module.exports === "function"' +
          '? module.exports.options' +
          ': module.exports).template = ' + JSON.stringify(template) + '\n'
    }
    // hot reload
    if (process.env.NODE_ENV !== 'production' && !process.env.VUEIFY_TEST) {
      output +=
        'if (module.hot) {(function () {' +
        '  module.hot.accept()\n' +
        '  var hotAPI = require("' + hotReloadAPIPath + '")\n' +
        '  hotAPI.install(require("vue"), true)\n' +
        '  if (!hotAPI.compatible) return\n' +
        // remove style tag on dispose
        (style
          ? '  module.hot.dispose(function () {\n' +
            '    __vueify_insert__.cache[' + style + '] = false\n' +
            '    document.head.removeChild(__vueify_style__)\n' +
            '  })\n'
          : ''
        ) +
        '  if (!module.hot.data) {\n' +
        // initial insert
        '    hotAPI.createRecord("' + id + '", module.exports)\n' +
        '  } else {\n' +
        // update
        '    hotAPI.update("' + id + '", module.exports, (typeof module.exports === "function" ? module.exports.options : module.exports).template)\n' +
        '  }\n' +
        '})()}'
    }
    cb(null, output)
  }
}

/**
 * Ensure there's only one template node.
 *
 * @param {Fragment} fragment
 * @return {Boolean}
 */

function validateNodeCount (fragment) {
  var count = 0
  fragment.childNodes.forEach(function (node) {
    if (node.nodeName === 'template') {
      count++
    }
  })
  return count <= 1
}

/**
 * Check if a style node is scoped.
 *
 * @param {Node} node
 * @return {Boolean}
 */

function isScoped (node) {
  return node.attrs && node.attrs.some(function (attr) {
    return attr.name === 'scoped'
  })
}

/**
 * Process a template node
 *
 * @param {Node} node
 * @param {String} filePath
 * @param {String} id
 * @param {Boolean} hasScopedStyle
 * @param {String} fullSource
 * @return {Promise}
 */

function processTemplate (node, filePath, id, hasScopedStyle, fullSource) {
  var lang = checkLang(node)
  var template = checkSrc(node, filePath) || (
    lang
      ? getRawTemplate(node, fullSource) // custom template, extract as raw string
      : parse5.serialize(node.content) // normal HTML, use serialization
  )
  template = deindent(template)
  if (!lang) {
    var warnings = validateTemplate(node.content, fullSource)
    if (warnings) {
      var relativePath = path.relative(process.cwd(), filePath)
      warnings.forEach(function (msg) {
        console.warn(chalk.red('\n  Error in ' + relativePath + ':\n') + msg)
      })
    }
  }
  return compileAsPromise('template', template, lang, filePath)
    .then(function (res) {
      if (hasScopedStyle) {
        return rewriteTemplate(id, res.source)
      } else {
        return res
      }
    })
    .then(function (res) {
      if (process.env.NODE_ENV === 'production') {
        res.source = require('html-minifier').minify(res.source, htmlMinifyOptions)
      }
      return res
    })
}

/**
 * Extract the raw content of a template node.
 * This is more reliable because if the user uses a template language
 * that would confuse parse5 (e.g. ejs), the serialization result
 * would be different from original.
 *
 * @param {Node} node
 * @param {String} source
 */

function getRawTemplate (node, source) {
  var content = node.content
  var l = content.childNodes.length
  if (!l) return ''
  var start = content.childNodes[0].__location.startOffset
  var end = content.childNodes[l - 1].__location.endOffset
  return source.slice(start, end)
}

/**
 * Process a style node
 *
 * @param {Node} node
 * @param {String} id
 * @param {String} filePath
 * @return {Promise}
 */

function processStyle (node, filePath, id) {
  var style = checkSrc(node, filePath) || parse5.serialize(node)
  var lang = checkLang(node)
  style = deindent(style)
  return compileAsPromise('style', style, lang, filePath)
    .then(function (res) {
      return rewriteStyle(id, res.source, isScoped(node))
    })
}

/**
 * Process a script node
 *
 * @param {Node} node
 * @param {String} filePath
 * @param {String} content
 * @return {Promise}
 */

function processScript (node, filePath, content) {
  var lang = checkLang(node) || 'babel'
  var script = checkSrc(node, filePath)
  if (!script) {
    script = parse5.serialize(node)
    // pad the script to ensure correct line number for syntax errors
    var location = content.indexOf(script)
    var before = padContent(content.slice(0, location))
    script = before + script
  }
  script = deindent(script)
  return compileAsPromise('script', script, lang, filePath)
}

/**
 * Check the lang attribute of a parse5 node.
 *
 * @param {Node} node
 * @return {String|undefined}
 */

function checkLang (node) {
  if (node.attrs) {
    var i = node.attrs.length
    while (i--) {
      var attr = node.attrs[i]
      if (attr.name === 'lang') {
        return attr.value
      }
    }
  }
}

/**
 * Check src import for a node, relative to the filePath if
 * available. Using readFileSync for now since this is a
 * rare use case.
 *
 * @param {Node} node
 * @param {String} filePath
 * @return {String}
 */

function checkSrc (node, filePath) {
  var dir = path.dirname(filePath)
  if (node.attrs) {
    var i = node.attrs.length
    while (i--) {
      var attr = node.attrs[i]
      if (attr.name === 'src') {
        var src = attr.value
        if (src) {
          filePath = path.resolve(dir, src)
          compiler.emit('dependency', filePath)
          try {
            return fs.readFileSync(filePath, 'utf-8')
          } catch (e) {
            console.warn(
              'Failed to load src: "' + src +
              '" from file: "' + filePath + '"'
            )
          }
        }
      }
    }
  }
}

/**
 * Compile a piece of source code with an async compiler and
 * return a Promise.
 *
 * @param {String} type
 * @param {String} source
 * @param {String} lang
 * @param {String} filePath
 * @return {Promise}
 */

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
        resolve({
          source: res,
          type: type
        })
      }, compiler, filePath)
    })
  } else {
    return Promise.resolve({
      source: source,
      type: type
    })
  }
}

/**
 * Extract parts from resolved array.
 *
 * @param {Array} parts
 * @param {String} type
 */

function extract (parts, type) {
  return parts
    .filter(function (part) {
      return part.type === type
    })
    .map(function (part) {
      return part.source
    })
    .join('\n')
}

/**
 * Pad content into empty lines.
 */

function padContent (content, lang) {
  return content
    .split(/\r?\n/g)
    .map(function () { return '' })
    .join('\n')
}
