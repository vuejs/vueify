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

If you are using npm 3+, it no longer auto install the peer dependencies. So you will also have to also install the babel-related dependencies:

``` bash
npm install\
  babel-core\
  babel-preset-es2015\
  babel-runtime\
  babel-plugin-transform-runtime\
  --save-dev
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

browserify('./main.js')
  .transform(vueify)
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
```

## Building for Production

Make sure to have the `NODE_ENV` environment variable set to `"production"` when building for production! This strips away unnecessary code (e.g. hot-reload) for smaller bundle size.

If you are using Gulp, note that `gulp --production` **does not** affect vueify; you still need to explicitly set `NODE_ENV=production`.

## ES2015 by Default

Vueify automatically transforms the JavaScript in your `*.vue` components using Babel. Write ES2015 today!

The default Babel (6) options used for Vue.js components are:

``` js
{
  "presets": ["es2015"],
  "plugins": ["transform-runtime"]
}
```

If you wish to override this, you can add a `.babelrc` file at the root of your project:

``` json
{
  "presets": ["es2015", "stage-2"],
  "plugins": ["transform-runtime"]
}
```

You can also configure babel with the `babel` field in `vue.config.js`, which will take the highest priority.

## Enabling Pre-Processors

You need to install the corresponding node modules to enable the compilation. e.g. to get stylus compiled in your Vue components, do `npm install stylus --save-dev`.

These are the built-in preprocessors:

- stylus
- less
- scss (via `node-sass`, use `sass` in [config section](#configuring-options))
- jade
- pug
- coffee-script (use `coffee` in [config section](#configuring-options))

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
  // configure html minification in production mode
  // see https://github.com/kangax/html-minifier#options-quick-reference
  htmlMinifier: {
    // ...
  },
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

// filePath should be an absolute path
compiler.compile(fileContent, filePath, function (err, result) {
  // result is a common js module string
})
```

## Syntax Highlighting

Currently there are syntax highlighting support for [Sublime Text](https://github.com/vuejs/vue-syntax-highlight), [Atom](https://atom.io/packages/language-vue), [Vim](https://github.com/posva/vim-vue), [Visual Studio Code](https://marketplace.visualstudio.com/items/liuji-jim.vue) and [Brackets](https://github.com/pandao/brackets-vue). Contributions for other editors/IDEs are highly appreciated! If you are not using any pre-processors in Vue components, you can also get by by treating `*.vue` files as HTML in your editor.

## Example

For an example setup using most of the features mentioned above, see [vuejs/vueify-example](https://github.com/vuejs/vueify-example).

If you use Webpack, there's also [vue-loader](https://github.com/vuejs/vue-loader) that does the same thing.

## Changelog

### 8.5.0

- Now also supports passing in Vueify options via browserify transform options. The options are exactly the same as `vue.config.js`.

### 8.4.0

- Removed peer dependencies. Now vueify simply warns you when you are using a feature that requires a missing dependency.

### 8.3.0

- Added compile-time template syntax validation that catches common errors.
- Code blocks with base indents are now de-indented before being processed.

### 8.2.0

- Added `htmlMinifier` option in config that allows configuration of HTML minification in production mode.
- Fixed HTML minification removing `type` attribute for `<input type="text">`.

### 8.1.0

- Vueify now respects `.babelrc` over default options.

### 8.0.0

- `babel-core` is now a peer dependency.

### 7.0.0

- Added relative `@import` path support and import dependency tracking for LESS, SASS & Stylus. Now you can `@import` files using relative paths to the file being edited, and editing these imported files will also trigger watchify rebuild.

- Removed built-in compiler for `myth`. Prefer using PostCSS + CSSNext.

### 6.0.0

- Upgraded to Babel 6. This is a breaking change because the babel configuration is now different.

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
