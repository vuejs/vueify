# vueify [![Build Status](https://circleci.com/gh/vuejs/vueify.svg?style=shield)](https://circleci.com/gh/vuejs/vueify) [![npm version](https://badge.fury.io/js/vueify.svg)](http://badge.fury.io/js/vueify)

> [Browserify](http://browserify.org/) transform for [Vue.js](http://vuejs.org/) components, with scoped CSS and component hot-reloading.

**NOTE: master branch now hosts version ^9.0, which only works with Vue ^2.0. Vueify 8.x which works with Vue 1.x is in the [8.x branch](https://github.com/vuejs/vueify/tree/8.x).**

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
export default {
  data () {
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

And you can import using the `src` attribute:

``` html
<style lang="stylus" src="style.styl"></style>
```

Under the hood, the transform will:

- extract the styles, compile them and insert them with the `insert-css` module.
- extract the template, compile it and add it to your exported options.

You can `require()` other stuff in the `<script>` as usual. ~~Note that for CSS-preprocessor @imports, the path should be relative to your project root directory.~~ Starting in 7.0.0, `@import` in LESS, SASS and Stylus files can be either relative to your build tool root working directory, or to the file being edited. Or one can set import paths in options.

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
  el: '#app',
  render: function (createElement) {
    return createElement(App)
  }
})
```

In your HTML:

``` html
<body>
  <div id="app"></div>
  <script src="build.js"></script>
</body>
```

If you are using `vueify` in Node:

``` js
var fs = require("fs")
var browserify = require('browserify')
var vueify = require('vueify')

browserify('./main.js')
  .transform(vueify)
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
```

## Building for Production

Make sure to have the `NODE_ENV` environment variable set to `"production"` when building for production! This strips away unnecessary code (e.g. hot-reload) for smaller bundle size.

If you are using Gulp, note that `gulp --production` **does not** affect vueify; you still need to explicitly set `NODE_ENV=production`.

## ES2015 with Babel

Vueify is pre-configured to work with Babel. Simply install Babel-related dependencies:

``` bash
npm install\
  babel-core\
  babel-preset-es2015\
  --save-dev
```

Then create a `.babelrc`:

``` json
{
  "presets": ["es2015"]
}
```

And voila! You can now write ES2015 in your `*.vue` files. Note if you want to use ES2015 on normal `*.js` files, you will also need [babelify](https://github.com/babel/babelify).

You can also configure babel with the `babel` field in `vue.config.js`, which will take the highest priority.

## Enabling Other Pre-Processors

For other pre-processors, you also need to install the corresponding node modules to enable the compilation. e.g. to get stylus compiled in your Vue components, do `npm install stylus --save-dev`.

These are the preprocessors supported by vueify out of the box:

- stylus
- less
- scss (via `node-sass`, use `sass` in [config section](#configuring-options))
- jade
- pug
- coffee-script (use `coffee` in [config section](#configuring-options))

## PostCSS

Vueify uses PostCSS for scoped CSS rewrite. You can also provide your own PostCSS plugins! See [config section](#configuring-options) below for an example.

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
  // register custom compilers
  customCompilers: {
    // for tags with lang="ts"
    ts: function (content, cb, compiler, filePath) {
      // content:  content extracted from lang="ts" blocks
      // cb:       the callback to call when you're done compiling
      // compiler: the vueify compiler instance
      // filePath: the path for the file being compiled
      //
      // compile some TypeScript... and when you're done:
      cb(null, result)
    }
  }
}
```

Example using custom PostCSS plugin:

``` js
var cssnext = require('cssnext')

module.exports = {
  postcss: [cssnext()]
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

browserify('./main.js')
  .transform(vueify)
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
```

Or simply pass configuration object to `vueify` (in Node) (for instance to set sass search paths as in the following example):

``` js
var fs = require("fs")
var browserify = require('browserify')
var vueify = require('vueify')

browserify('./main.js')
  .transform(vueify, {
    sass: {
      includePaths: [...]
    },
    // ...same as in vue.config.js
  })
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
```

## Scoped CSS

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

### Scoped CSS Notes

1. You can include both scoped and non-scoped styles in the same component.

2. The following will be affected by both the parent's scoped CSS and the child's scoped CSS:
  - A child component's root node
  - Content inserted to a child component via `<slot>`

## Hot Reload

To enable hot component reloading, you need to install the [browserify-hmr](https://github.com/AgentME/browserify-hmr) plugin:

``` bash
npm install browserify-hmr --save-dev
watchify -p browserify-hmr index.js -o bundle.js
```

You can scaffold a hot-reload enabled project easily using `vue-cli` and the [this template](https://github.com/vuejs-templates/browserify-simple).

## CSS Extraction

By default, the CSS in each component is injected into the page using a `<style>` tag. This works well in most scenarios and enables CSS hot-reloading during development. However, in some cases you may prefer extracting all component CSS into a single file for better performance. To do that, you will need to add the CSS extraction browserify plugin.

Via CLI:

``` bash
browserify -t vueify -p [ vueify/plugins/extract-css -o dist/bundle.css ] main.js
```

Via API:

``` js
browserify('./main.js')
  .transform('vueify')
  .plugin('vueify/plugins/extract-css', {
    out: 'dist/bundle.css' // can also be a WritableStream
  })
  .bundle()
```

This only works for vueify 9+. For Vue 1.x / vueify 8.x you can use [vueify-extract-css](https://github.com/rawcreative/vueify-extract-css).

## Building for Production

When building for production, follow these steps to ensure smaller bundle size:

1. Make sure `process.env.NODE_ENV === "production"`. This tells `vueify` to avoid including hot-reload related code.

2. Apply a global [envify](https://github.com/hughsk/envify) transform to your bundle. This allows the minifier to strip out all the warnings in Vue's source code wrapped in env variable conditional blocks.

## Compiler API

The compiler API (originally `vue-component-compiler`) is also exposed:

``` js
var compiler = require('vueify').compiler

// filePath should be an absolute path
compiler.compile(fileContent, filePath, function (err, result) {
  // result is a common js module string
})
```

## Syntax Highlighting

Currently there are syntax highlighting support for [Sublime Text](https://github.com/vuejs/vue-syntax-highlight), [Atom](https://atom.io/packages/language-vue), [Vim](https://github.com/posva/vim-vue), [Visual Studio Code](https://marketplace.visualstudio.com/items/liuji-jim.vue) and [Brackets](https://github.com/pandao/brackets-vue). Contributions for other editors/IDEs are highly appreciated! If you are not using any pre-processors in Vue components, you can also get by by treating `*.vue` files as HTML in your editor.

## Changelog

Please see the [Releases](https://github.com/vuejs/vueify/releases) page for changes in versions ^9.0.0.

## License

[MIT](http://opensource.org/licenses/MIT)
