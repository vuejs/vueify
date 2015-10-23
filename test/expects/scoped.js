var __vueify_style__ = require("vueify-insert-css").insert("div[{{id}}]{color:red}.test[{{id}}]{color:green}")
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<div {{id}}=\"\">hi<p class=\"test\" {{id}}=\"\">bye</p></div>"
