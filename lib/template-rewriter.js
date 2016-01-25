var parse5 = require('parse5')
var cache = require('lru-cache')(100)

/**
 * Add attribute to template
 *
 * @param {String} id
 * @param {String} html
 * @return {String}
 */

module.exports = function (id, html) {
  var key = id + '!!' + html
  var val = cache.get(key)
  if (val) {
    return Promise.resolve(val)
  }
  var tree = parse5.parseFragment(html)
  walk(tree, function (node) {
    if (node.attrs) {
      node.attrs.push({
        name: id,
        value: ''
      })
    }
  })
  val = {
    source: parse5.serialize(tree),
    type: 'template'
  }
  cache.set(key, val)
  return Promise.resolve(val)
}

function walk (tree, fn) {
  if (tree.childNodes) {
    tree.childNodes.forEach(function (node) {
      var isTemplate = node.tagName === 'template'
      if (!isTemplate) {
        fn(node)
      }
      if (isTemplate && node.content) {
        walk(node.content, fn)
      } else {
        walk(node, fn)
      }
    })
  }
}
