process.env.VUEIFY_TEST = true

const fs = require('fs')
const path = require('path')
const expect = require('chai').expect
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const browserify = require('browserify')
const vueify = require('../index')
const jsdom = require('jsdom')
const vueCompiler = require('vue-template-compiler')
const transpile = require('vue-template-es2015-compiler')
const genId = require('../lib/gen-id')

const tempDir = path.resolve(__dirname, './temp')
const mockEntry = path.resolve(tempDir, 'entry.js')
rimraf.sync(tempDir)
mkdirp.sync(tempDir)

function test (file, assert) {
  it(file, done => {
    fs.writeFileSync(mockEntry, 'window.vueModule = require("../fixtures/' + file + '.vue")')
    browserify(mockEntry)
      .transform(vueify)
      .bundle((err, buf) => {
        if (err) return done(err)
        jsdom.env({
          html: '<!DOCTYPE html><html><head></head><body></body></html>',
          src: [buf.toString()],
          done: (err, window) => {
            if (err) return done(err)
            assert(window)
            done()
          }
        })
      })
  })
}

function testCssExtract (file, assert) {
  it(file, done => {
    fs.writeFileSync(mockEntry, 'window.vueModule = require("../fixtures/' + file + '.vue")')
    browserify(mockEntry)
      .transform(vueify)
      .plugin('./plugins/extract-css', { out: { write: assert, end: done }})
      .bundle((err, buf) => {
        if (err) return done(err)
      })
  })
}

function assertRenderFn (options, template) {
  const compiled = vueCompiler.compile(template)
  expect(options.render.toString()).to.equal(transpile('function render() {' + compiled.render + '}'))
}

describe('vueify', () => {
  test('basic', window => {
    const module = window.vueModule
    assertRenderFn(module, '<h2 class="red">{{msg}}</h2>')
    expect(module.data().msg).to.contain('Hello from Component A!')
    const style = window.document.querySelector('style').textContent
    expect(style).to.contain('comp-a h2 {\n  color: #f00;\n}')
  })

  test('pre-processors', window => {
    var module = window.vueModule
    assertRenderFn(module,
      '<div>' +
        '<h1>This is the app</h1>' +
        '<comp-a></comp-a>' +
        '<comp-b></comp-b>' +
      '</div>'
    )
    expect(module.data().msg).to.contain('Hello from coffee!')
    var style = window.document.querySelector('style').textContent
    // stylus
    expect(style).to.contain('body {\n  font: 100% Helvetica, sans-serif;\n  color: #999;\n}')
    // sass
    expect(style).to.contain('h1 {\n  color: red;')
    // less
    expect(style).to.contain('h1 {\n  color: green;')
  })

  test('pug', window => {
    var module = window.vueModule
    assertRenderFn(module,
      '<div>' +
        '<h1>This is the app</h1>' +
        '<comp-a></comp-a>' +
        '<comp-b></comp-b>' +
      '</div>'
    )
  })

  test('scoped-css', window => {
    var module = window.vueModule
    var id = 'data-v-' + genId(require.resolve('./fixtures/scoped-css.vue'))
    expect(module._scopeId).to.equal(id)
    assertRenderFn(module,
      '<div>' +
        '<div><h1>hi</h1></div>\n' +
        '<p class="abc def">hi</p>\n' +
        '<template v-if="ok"><p class="test">yo</p></template>\n' +
        '<svg><template><p></p></template></svg>' +
      '</div>'
    )
    var style = window.document.querySelector('style').textContent
    expect(style).to.contain('.test[' + id + '] {\n  color: yellow;\n}')
    expect(style).to.contain('.test[' + id + ']:after {\n  content: \'bye!\';\n}')
    expect(style).to.contain('h1[' + id + '] {\n  color: green;\n}')
  })

  test('style-import', window => {
    var styles = window.document.querySelectorAll('style')
    expect(styles[0].textContent).to.contain('h1 { color: red; }')
    // import with scoped
    var id = 'data-v-' + genId(require.resolve('./fixtures/style-import.vue'))
    expect(styles[0].textContent).to.contain('h1[' + id + '] { color: green; }')
  })

  test('template-import', window => {
    var module = window.vueModule
    assertRenderFn(module, '<div><h1>hello</h1></div>')
  })

  test('script-import', window => {
    var module = window.vueModule
    expect(module.data().msg).to.contain('Hello from Component A!')
  })

  test('media-query', window => {
    var style = window.document.querySelector('style').textContent
    var id = 'data-v-' + genId(require.resolve('./fixtures/media-query.vue'))
    expect(style).to.contain('@media print {\n  .foo[' + id + '] {\n    color: #000;\n  }\n}')
  })

  testCssExtract('style-export', css => {
    expect(css).to.equal('h2 {color: red;}')
  })
})
