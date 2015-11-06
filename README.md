# vueify [![Build Status](https://circleci.com/gh/vuejs/vueify.svg?style=shield)](https://circleci.com/gh/vuejs/vueify) [![npm version](https://badge.fury.io/js/vueify.svg)](http://badge.fury.io/js/vueify)

> [Browserify](http://browserify.org/) transform for [Vue.js](http://vuejs.org/) components, with scoped CSS and component hot-reloading.

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

``` vue
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
var App = require('./app.vue')

new Vue({
  el: 'body',
  components: {
    app: App
  }
})
```

In your HTML:

``` html
<body>
  <app></app>
  <script src="build.js"></script>
</body>
```

If you are using `vueify` in Node:

``` js
var fs = require("fs")
var browserify = require('browserify')
var vueify = require('vueify')

browserify('./entry.js')
  .transform(vueify)
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
```

## ES2015 by Default

Vueify 4.0+ automatically transforms the JavaScript in your `*.vue` components using Babel. Write ES2015 today!

The default Babel options used for Vue.js components are:

``` js
{
  // use babel-runtime library for common helpers
  optional: ['runtime'],
  // use loose mode for faster builds
  loose: 'all',
  // disable non-standard stuff (e.g. JSX)
  nonStandard: false
}
```

If you wish to mofidy this, you can add a `vue.config.js` and configure the option for `babel`:

``` js
// vue.config.js
module.exports = {
  babel: {
    stage: 0, // use all the fancy stage 0 features!
    optional: ['runtime'],
    loose: 'all',
    nonStandard: false
  }
}
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

## Autoprefix by Default

Starting in 5.0.0, all CSS output via vueify will be autoprefixed by default. See [config section](#configuring-options) below on customizing the options.

## PostCSS

Vueify uses PostCSS for scoped CSS rewrite and autoprefixing. You can also provide your own PostCSS plugins! See [config section](#configuring-options) below for an example.

## Configuring Options

Create a `vue.config.js` file at where your build command is run (usually the root level of your project):

``` js
module.exports = {
  // configure a built-in compiler
  sass: {
    includePaths: [...]
  },
  // provide your own postcss plugins
  postcss: [...],
  // configure autoprefixer
  autoprefixer: {
    browsers: ['last 2 versions']
  },
  // register custom compilers
  customCompilers: {
    // for tags with lang="ts"
    ts: function (content, cb) {
      // compile some TypeScript...
      cb(null, result)
    }
  }
}
```

Example using custom PostCSS plugin:

``` js
var cssnext = require('cssnext')

module.exports = {
  postcss: [cssnext()],
  // disable autoprefixer since cssnext comes with it
  autoprefixer: false
}
```

Alternatively, if you are using `vueify` in Node and don't want to create a `vue.config.js` file:

``` js
var fs = require("fs")
var browserify = require('browserify')
var vueify = require('vueify')

// apply custom config
vueify.compiler.applyConfig({
  // ...same as in vue.config.js
})

browserify('./entry.js')
  .transform(vueify)
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
```

### Scoped CSS

> Experimental

When a `<style>` tag has the `scoped` attribute, its CSS will apply to elements of the current component only. This is similar to the style encapsulation found in Shadow DOM, but doesn't require any polyfills. It is achieved by transforming the following:

``` html
<style scoped>
.example {
  color: red;
}
</style>
<template>
  <div class="example">hi</div>
</template>
```

Into the following:

``` html
<style>
.example[_v-1] {
  color: red;
}
</style>
<template>
  <div class="example" _v-1>hi</div>
</template>
```

#### Notes

1. You can include both scoped and non-scoped styles in the same component.

2. A child component's root node will be affected by both the parent's scoped CSS and the child's scoped CSS.

3. Partials are not affected by scoped styles.

### Hot Reload

> Experimental

To enable hot component reloading, you need to install the [browserify-hmr](https://github.com/AgentME/browserify-hmr) plugin:

``` bash
npm install browserify-hmr --save-dev
watchify -p browserify-hmr index.js -o bundle.js
```

A full setup example with hot reloading is available at [vuejs/vueify-example](https://github.com/vuejs/vueify-example).

## Compiler API

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

For an example setup using most of the features mentioned above, see [vuejs/vueify-example](https://github.com/vuejs/vueify-example).

If you use Webpack, there's also [vue-loader](https://github.com/vuejs/vue-loader) that does the same thing.

## Changelog

### 5.0.4

- Added `postcss` option for providing custom PostCSS plugins.

### 5.0.0

- New: CSS output is now autoprefixed by default.
- Changed: [New config file format](#configuring-options)

### 4.0.0

- Support ES2015 by default.

### 3.0.0

- Added support for [scoped CSS](#scoped-css) and [component hot reloading](#hot-reload).

### 2.0.1

- Built-in lang for ES2015 has been renamed from `es6` to `es`.

- `es` transforms now uses loose mode and optional runtime by default. This means in addition to installing `babel`, you should also install `babel-runtime`.

- Templates and CSS are now non-minified by default. To enable minification, run the build with `NODE_ENV=production`.

- Options for built-in pre-processors can now be configured in `vue.config.js`.

- `vue-component-compiler` has been merged into `vueify`. It is now exposed as `require('vueify').compiler`.
