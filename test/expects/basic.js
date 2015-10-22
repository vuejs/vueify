var __vueify_style_insert__ = require({{insertCssPath}})
var __vueify_style__ = __vueify_style_insert__.insert("html{font-size:20px}")
var a = 123
module.exports = {
  data: function () {
    return 123
  }
}
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<h1 :id=\"id\" @click=\"hi\">hello</h1>"
