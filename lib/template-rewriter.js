var parse5 = require('parse5')
var parser = new parse5.Parser()
var serializer = new parse5.Serializer()
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
  var tree = parser.parseFragment(html)
  walk(tree, function (node) {
    if (node.attrs) {
      node.attrs.push({
        name: id,
        value: ''
      })
    }
  })
  val = {
    source: serializer.serialize(tree),
    type: 'template'
  }
  cache.set(key, val)
  return Promise.resolve(val)
}

function walk (tree, fn) {
  if (tree.childNodes) {
    tree.childNodes.forEach(function (node) {
      fn(node)
      walk(node, fn)
    })
  }
}
