var postcss = require('postcss')
var selectorParser = require('postcss-selector-parser')

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
 * @return {Promise}
 */

module.exports = function (id, css) {
  currentId = id
  return postcss([addId])
    .process(css)
    .then(function (res) {
      return {
        source: res.css,
        type: 'style'
      }
    })
}
