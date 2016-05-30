var __vueify_insert__ = require("vueify/lib/insert-css")
var __vueify_style__ = __vueify_insert__.insert("html{font-size:20px}")
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Test = function () {
  function Test() {
    (0, _classCallCheck3.default)(this, Test);
  }

  (0, _createClass3.default)(Test, [{
    key: "ok",
    value: function ok() {}
  }]);
  return Test;
}();

var evens = [2, 4, 6, 8];
var odds = evens.map(function (v) {
  return v + 1;
});
exports.default = {
  data: function data() {
    return odds;
  }
};
if (module.exports.__esModule) module.exports = module.exports.default
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<h1 :id=id @click=hi>hello</h1><input type=text> <button :disabled=loading>hihi</button>"
