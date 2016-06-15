process.env.VUEIFY_TEST = true

const fs = require('fs')
const path = require('path')
const expect = require('chai').expect
const hash = require('hash-sum')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const browserify = require('browserify')
const vueify = require('../index')
const jsdom = require('jsdom')
const vueCompiler = require('vue-template-compiler')

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

function assertRenderFn (options, template) {
  const compiled = vueCompiler.compile(template)
  expect(options.render.toString()).to.equal('function (){' + compiled.render + '}')
}

describe('vueify', () => {
  test('basic', window => {
    const module = window.vueModule
    assertRenderFn(module, '<h2 class="red">{{msg}}</h2>')
    expect(module.data().msg).to.contain('Hello from Component A!')
    const style = window.document.querySelector('style').textContent
    expect(style).to.contain('comp-a h2 {\n  color: #f00;\n}')
  })
})
