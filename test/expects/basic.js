var __vueify_style__ = require("vueify-insert-css").insert("html{font-size:20px}")
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

exports.__esModule = true;

var Test = (function () {
  function Test() {
    _classCallCheck(this, Test);
  }

  Test.prototype.ok = function ok() {};

  return Test;
})();

var evens = [2, 4, 6, 8];
var odds = evens.map(function (v) {
  return v + 1;
});
exports["default"] = {
  data: function data() {
    return odds;
  }
};
module.exports = exports["default"];
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<h1 :id=\"id\" @click=\"hi\">hello</h1>"
