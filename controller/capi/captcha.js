'use strict'
const router = require('koa-router')()
const ccap = require('ccap')()


router.prefix('/capi')

router.get('/captcha', async function (ctx, next) {
  return next().then(() => {
    let ary = ccap.get()
    let txt = ary[0]
    let buf = ary[1]
    ctx.body = buf
    ctx.type = 'image/png'
    ctx.session.captcha = txt
  })
})

module.exports = router
