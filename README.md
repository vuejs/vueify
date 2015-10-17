# vueify [![npm version](https://badge.fury.io/js/vueify.svg)](http://badge.fury.io/js/vueify) [![Build Status](https://circleci.com/gh/vuejs/vueify.svg?style=shield)](https://circleci.com/gh/vuejs/vueify)

> [Browserify](http://browserify.org/) transform for [Vue.js](http://vuejs.org/) components

This transform allows you to write your components in this format:

``` html
// app.vue
<style>
  .red {
    color: #f00;
  }
</style>

<template>
  <h1 class="red">{{msg}}</h1>
</template>

<script>
  module.exports = {
    data: function () {
      return {
        msg: 'Hello world!'
      }
    }
  }
</script>
```

You can also mix preprocessor languages in the component file:

``` html
// app.vue
<style lang="stylus">
.red
  color #f00
</style>

<template lang="jade">
h1(class="red") {{msg}}
</template>

<script lang="coffee">
module.exports =
  data: ->
    msg: 'Hello world!'
</script>
```

And you can import using the `src` attribute (note you'll have to save the vue file to trigger a rebuild since the imported file is not tracked by Browserify as a dependency):

``` html
<style lang="stylus" src="style.styl"></style>
```

Under the hood, the transform will:

- extract the styles, compile them and insert them with the `insert-css` module.
- extract the template, compile it and add it to your exported options.

You can `require()` other stuff in the `<script>` as usual. Note that for CSS-preprocessor @imports, the path should be relative to your project root directory.

## Usage

``` bash
npm install vueify --save-dev
browserify -t vueify -e src/main.js -o build/build.js
```

And this is all you need to do in your main entry file:

``` js
// main.js
var Vue = require('vue')
var appOptions = require('./app.vue')
var app = new Vue(appOptions).$mount('#app')
```

## Enabling Pre-Processors

You need to install the corresponding node modules to enable the compilation. e.g. to get stylus compiled in your Vue components, do `npm install stylus --save-dev`.

These are the built-in preprocessors:

- stylus
- less
- scss (via `node-sass`)
- jade
- coffee-script
- myth
- es (ECMAScript 2015 via Babel)

## Using ES2015 transform

The default options used for Babel is:

``` js
{
  loose: 'all',
  optional: ['runtime']
}
```

These options result in faster and smaller built code. This also means when using `lang="es"`, **you need install both `babel` and `babel-runtime`**.

## Pre-Processor Configuration

Create a `vue.config.js` file at where your build command is run (usually y the root level of your project):

``` js
module.exports = function (vueify) {

  // configure the options for a built-in language
  vueify.option('sass', {
    includePaths: [...]
  })

  // register a custom compile function for <script lang="es">
  vueify.register({
    lang: 'es',
    type: 'script',
    compile: function (content, cb) {
      // transform the content...
      cb(null, content)
    }
  })

}
```

### Compiler API

The compiler API (originally `vue-component-compiler`) is also exposed:

``` js
var compiler = require('vueify').compiler
// filePath should be an absolute path, and is optional if
// the fileContent doesn't contain src imports
compiler.compile(fileContent, filePath, function (err, result) {
  // result is a common js module string
})
```

## Syntax Highlighting

And here's a [SublimeText package](https://github.com/vuejs/vue-syntax-highlight) for enabling language highlighting/support in these embbeded code blocks.

## Example

For an example setup, see [vuejs/vueify-example](https://github.com/vuejs/vueify-example).

If you use Webpack, there's also [vue-loader](https://github.com/vuejs/vue-loader) that does the same thing.

## Changelog

### 2.0.0

- Built-in lang for ES2015 has been renamed from `es6` to `es`.

- Templates and CSS are now non-minified by default. To enable minification, run the build with `NODE_ENV=production`.

- `es6` transforms now uses loose mode and optional runtime by default. This means in addition to installing `babel`, you should also install `babel-runtime`.

- Options for built-in pre-processors can now be configured in `vue.config.js`.

- `vue-component-compiler` has been merged into `vueify`. It is now exposed as `require('vueify').compiler`.
