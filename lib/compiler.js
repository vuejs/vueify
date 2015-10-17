var fs = require('fs')
var path = require('path')
var parse5 = require('parse5')
var parser = new parse5.Parser()
var serializer = new parse5.TreeSerializer()
var async = require('async')
var compilers = require('./compilers')
var Emitter = require('events').EventEmitter

if (process.env.NODE_ENV === 'production') {
  var htmlMinifier = require('html-minifier')
  var CleanCSS = require('clean-css')
  var cssMinifier = new CleanCSS()
}

// required for Vue 1.0 shorthand syntax
var htmlMinifyOptions = {
  customAttrSurround: [[/@/, new RegExp('')], [/:/, new RegExp('')]]
}

var compiler = module.exports = new Emitter()

// expose method for registering custom pre-processors
compiler.register = compilers.register
compiler.loadConfig = compilers.loadConfig

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

  // only 1 template tag is allowed, while styles and
  // scripts are concatenated.
  var template
  var script = ''
  var style = ''
  var output = ''
  var jobs = []

  // parse the file into an HTML tree
  var fragment = parser.parseFragment(content)

  // Walk through the top level nodes and check for their
  // types & languages. If there are pre-processing needed,
  // push it into a jobs list.
  fragment.childNodes.forEach(function (node) {
    switch (node.nodeName) {

      // Tempalte
      case 'template':
        template = checkSrc(node, filePath) || serializeTemplate(node)
        var lang = checkLang(node)
        var compiler = compilers.template[lang]
        if (!compiler) {
          break
        }
        jobs.push(function (cb) {
          compiler(template, function (err, res) {
            template = res
            cb(err)
          })
        })
        break

      // Style
      case 'style':
        var rawStyle = checkSrc(node, filePath) || serializer.serialize(node)
        var lang = checkLang(node)
        var compiler = compilers.style[lang]
        if (!compiler) {
          style += rawStyle
          break
        }
        jobs.push(function (cb) {
          compiler(rawStyle, function (err, res) {
            style += res
            cb(err)
          })
        })
        break

      // Script
      case 'script':
        var rawScript = checkSrc(node, filePath) || serializer.serialize(node).trim()
        var lang = checkLang(node)
        var compiler = compilers.script[lang]
        if (!compiler) {
          script += (script ? '\n' : '') + rawScript
          break
        }
        jobs.push(function (cb) {
          compiler(rawScript, function (err, res) {
            script += (script ? '\n' : '') + res
            cb(err)
          })
        })
        break
    }
  })

  // process all pre-processing jobs in parallel
  async.parallel(jobs, function (err) {
    if (err) return cb(err)
    // style
    if (style) {
      if (process.env.NODE_ENV === 'production') {
        style = cssMinifier.minify(style).styles
      }
      output += 'require("insert-css")(' + JSON.stringify(style) + ');\n'
    }

    // template
    if (template) {
      if (process.env.NODE_ENV === 'production') {
        template = htmlMinifier.minify(template, htmlMinifyOptions)
      }
      output += 'var __vue_template__ = ' + JSON.stringify(template) + ';\n'
    }

    // js
    if (script) {
      output += script + '\n'
    }

    if (template) {
      output +=
        ';(typeof module.exports === "function"' +
          '? module.exports.options' +
          ': module.exports)' +
        '.template = __vue_template__;\n'
    }

    cb(null, output)
  })
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
          var filePath = path.resolve(dir, src)
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
