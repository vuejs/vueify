var postcss = require('postcss')
var selectorParser = require('postcss-selector-parser')
var cache = require('lru-cache')(100)
var options = require('./compilers/options')

var currentId
var addId = postcss.plugin('add-id', function () {
  return function (root) {
    root.each(function (node) {
      node.selector = selectorParser(function (selectors) {
        selectors.each(function (selector) {
          selector.append(selectorParser.attribute({
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
 * @return {Promise}
 */

module.exports = function (id, css, scoped) {
  var key = id + '!!' + css
  var val = cache.get(key)
  if (val) {
    return Promise.resolve(val)
  } else {
    currentId = id

    var processors = []
    if (scoped) {
      processors.push(addId)
    }
    if (options.autoprefixer !== false) {
      var autoprefixer = require('autoprefixer')(options.autoprefixer)
      processors.push(autoprefixer)
    }

    return postcss(processors)
      .process(css)
      .then(function (res) {
        var val = {
          source: res.css,
          type: 'style'
        }
        cache.set(key, val)
        return val
      })
  }
}
