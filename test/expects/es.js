"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

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
module.exports = {
  data: function data() {
    return odds;
  }
};
