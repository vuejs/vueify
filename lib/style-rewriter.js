var postcss = require('postcss')
var selectorParser = require('postcss-selector-parser')
var cache = require('lru-cache')(100)
var assign = require('object-assign')

var currentId
var addId = postcss.plugin('add-id', function () {
  return function (root) {
    root.each(function rewriteSelector (node) {
      if (!node.selector) {
        // handle media queries
        if (node.type === 'atrule' && node.name === 'media') {
          node.each(rewriteSelector)
        }
        return
      }
      node.selector = selectorParser(function (selectors) {
        selectors.each(function (selector) {
          var node = null
          selector.each(function (n) {
            if (n.type !== 'pseudo') node = n
          })
          selector.insertAfter(node, selectorParser.attribute({
            attribute: currentId
          }))
        })
      }).process(node.selector).result
    })
  }
})

/**
 * Add attribute selector to css
 *
 * @param {String} id
 * @param {String} css
 * @param {Boolean} scoped
 * @param {Object} options
 * @return {Promise}
 */

module.exports = function (id, css, scoped, options) {
  var key = id + '!!' + scoped + '!!' + css
  var val = cache.get(key)
  if (val) {
    return Promise.resolve(val)
  } else {
    var plugins = []
    var opts = {}

    if (options.postcss instanceof Array) {
      plugins = options.postcss.slice()
    } else if (options.postcss instanceof Object) {
      plugins = options.postcss.plugins || []
      opts = options.postcss.options
    }

    // scoped css rewrite
    // make sure the addId plugin is only pushed once
    if (scoped && plugins.indexOf(addId) === -1) {
      plugins.push(addId)
    }

    // remove the addId plugin if the style block is not scoped
    if (!scoped && plugins.indexOf(addId) !== -1) {
      plugins.splice(plugins.indexOf(addId), 1)
    }

    // minification
    if (process.env.NODE_ENV === 'production') {
      plugins.push(require('cssnano')(assign({
        safe: true
      }, options.cssnano)))
    }
    currentId = id
    return postcss(plugins)
      .process(css, opts)
      .then(function (res) {
        cache.set(key, res.css)
        return res.css
      })
  }
}

