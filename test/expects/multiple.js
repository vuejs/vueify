var __vueify_style__ = require("vueify-insert-css").insert("body{font:12px Helvetica,Arial,sans-serif}a.button{-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px}")
module.exports = {
  data: function() {
    return {
      a: 1,
      b: 2
    };
  },
  events: {
    'hook:created': function() {
      return console.log('created!');
    }
  }
};

;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<h1>Jade - node template engine<div id=\"container\" class=\"col\"><a href=\"http://vuejs.org\">You are amazing</a><p>Jade is a terse and simple\ntemplating language with a\nstrong focus on performance\nand powerful features.</p></div></h1>"
