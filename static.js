
'use strict'

/**
 * Module dependencies.
 */

const debug = require('debug')('static')
const { resolve } = require('path')
const assert = require('assert')
const send = require('koa-send')

/**
 * Expose `serve()`.
 */

module.exports = serve

/**
 * Serve static files from `root`.
 *
 * @param {String} root
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

function serve (root, opts, publicPath) {
  opts = Object.assign({}, opts)

  assert(root, 'root directory is required to serve files')

  // options
  debug('static "%s" %j', root, opts)
  opts.root = resolve(root)
  if (opts.index !== false) opts.index = opts.index || 'index.html'

  if (!opts.defer) {
    return async function serve (ctx, next) {
      let done = false

      if (ctx.method === 'HEAD' || ctx.method === 'GET') {
        try {
          let newPath = ctx.path
          if (publicPath) {
            newPath = newPath.replace(`/${publicPath}`, '')
          }
          done = await send(ctx, newPath, opts)
        } catch (err) {
          if (err.status !== 404) {
            throw err
          }
        }
      }

      if (!done) {
        await next()
      }
    }
  }

  return async function serve (ctx, next) {
    await next()

    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return
    // response is already handled
    if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line

    try {
      let newPath = ctx.path
      if (publicPath) {
        newPath = newPath.replace(`/${publicPath}`, '')
      }
      await send(ctx, newPath, opts)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      }
    }
  }
}
