var __vueify_style_insert__ = require({{insertCssPath}})
var __vueify_style__ = __vueify_style_insert__.insert("\n  html {\n    font-size: 20px;\n  }\n")
var a = 123
module.exports = {
  data: function () {
    return 123
  }
}
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "\n  <h1 :id=\"id\" @click=\"hi\">hello</h1>\n"
