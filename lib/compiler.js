require('es6-promise').polyfill()
var fs = require('fs')
var path = require('path')
var parse5 = require('parse5')
var parser = new parse5.Parser()
var serializer = new parse5.TreeSerializer()
var hash = require('hash-sum')
var compilers = require('./compilers')
var options = require('./compilers/options')
var rewriteStyle = require('./style-rewriter')
var rewriteTemplate = require('./template-rewriter')
var Emitter = require('events').EventEmitter

// production minifiers
if (process.env.NODE_ENV === 'production') {
  var htmlMinifier = require('html-minifier')
  // required for Vue 1.0 shorthand syntax
  var htmlMinifyOptions = {
    customAttrSurround: [[/@/, new RegExp('')], [/:/, new RegExp('')]]
  }
}

// expose compiler
var compiler = module.exports = new Emitter()

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
  var fragment = parser.parseFragment(content)

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
        return processTemplate(node, filePath, id, hasScopedStyle)
      case 'style':
        return processStyle(node, filePath, id)
      case 'script':
        return processScript(node, filePath)
    }
  })
  .filter(function (p) { return p }))
  .then(mergeParts)
  .catch(function (err) {
    console.log(err.stack)
    cb(err)
  })

  function mergeParts (parts) {
    var output = ''
    // styles
    var style = extract(parts, 'style')
    if (style) {
      style = JSON.stringify(style)
      output +=
        'var __vueify_style__ = require("vueify-insert-css").insert(' + style + ')\n'
    }
    // script
    var script = extract(parts, 'script')
    if (script) {
      output += script + '\n'
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
        '  var hotAPI = require("vue-hot-reload-api")\n' +
        '  hotAPI.install(require("vue"), true)\n' +
        '  if (!hotAPI.compatible) return\n' +
        '  var id = ' + JSON.stringify(filePath) + '\n' +
        // remove style tag on dispose
        (style
          ? '  module.hot.dispose(function () {\n' +
            '    require("vueify-insert-css").cache[' + style + '] = false\n' +
            '    document.head.removeChild(__vueify_style__)\n' +
            '  })\n'
          : ''
        ) +
        '  if (!module.hot.data) {\n' +
        // initial insert
        '    hotAPI.createRecord(id, module.exports)\n' +
        '  } else {\n' +
        // update
        '    hotAPI.update(id, module.exports, module.exports.template)\n' +
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
 * @return {Promise}
 */

function processTemplate (node, filePath, id, hasScopedStyle) {
  var template = checkSrc(node, filePath) || serializeTemplate(node)
  var lang = checkLang(node)
  return compileAsPromise('template', template, lang)
    .then(function (res) {
      if (hasScopedStyle) {
        return rewriteTemplate(id, res.source)
      } else {
        return res
      }
    })
    .then(function (res) {
      if (process.env.NODE_ENV === 'production') {
        res.source = htmlMinifier.minify(res.source, htmlMinifyOptions)
      }
      return res
    })
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
  var style = checkSrc(node, filePath) || serializer.serialize(node)
  var lang = checkLang(node)
  return compileAsPromise('style', style, lang)
    .then(function (res) {
      return rewriteStyle(id, res.source, isScoped(node))
    })
}

/**
 * Process a script node
 *
 * @param {Node} node
 * @param {String} filePath
 * @return {Promise}
 */

function processScript (node, filePath) {
  var script = checkSrc(node, filePath) || serializer.serialize(node).trim()
  var lang = checkLang(node) || 'babel'
  return compileAsPromise('script', script, lang)
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

// Work around changes in parse5 >= 1.2.0
function serializeTemplate (node) {
  var childNode = node.childNodes[0]
  if (childNode && childNode.nodeName === '#document-fragment') {
    return serializer.serialize(childNode)
  }
  return serializer.serialize(node)
}

/**
 * Compile a piece of source code with an async compiler and
 * return a Promise.
 *
 * @param {String} type
 * @param {String} source
 * @param {String} lang
 * @return {Promise}
 */

function compileAsPromise (type, source, lang) {
  var compile = compilers[lang]
  if (compile) {
    return new Promise(function (resolve, reject) {
      compile(source, function (err, res) {
        if (err) return reject(err)
        resolve({
          source: res,
          type: type
        })
      })
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
