const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const onerror = require('koa-onerror')
const error = require('koa-json-error')
const bodyparser = require('koa-bodyparser')()
const logger = require('koa-logger')
const config = require('./config')
const session = require("koa-session2")
const ratelimit = require('koa-simple-ratelimit')
const SessionStore = require("./utils/session_store.js")
const errdef = require('./utils/errdef')
const Redis = require('ioredis')
const redis = new Redis(config.redis)

const magnet = require('./controller/capi/magnet')
const torrent = require('./controller/capi/torrent')
const user = require('./controller/capi/user')
const task = require('./controller/capi/task')
const api = require('./controller/api')
const captcha = require('./controller/capi/captcha')

// trust X-Forwarded
app.proxy = true
//onerror(app)
// json error style
app.use(error(errdef.formatError))
// json body
app.use(async (ctx, next) => {
  if (ctx.path === '/capi/torrent/upload') ctx.disableBodyParser = true
  await next()
})
app.use(bodyparser)
// json response
app.use(json())
// logger
app.use(logger())
// session
app.use(session({
    key: 'session',
    store: new SessionStore(),
    // 24H
    maxAge: 1000 * 60 * 60 * 24
}))
// session check
app.use(async (ctx, next) => {
    let bypass = false
    if (ctx.url.startsWith('/capi/')) {
        if (ctx.url.startsWith('/capi/user') || ctx.url.startsWith('/capi/captcha')) {
            bypass = true
        } else if (ctx.session.userInfo) {
          ctx.userId = ctx.session.userInfo.id
          bypass = true
        }
    }
    else if (ctx.url.startsWith('/api/')) {
        if (ctx.query.token === config.core.api_token) bypass = true
    } else {
        bypass = true
    }
    if (!bypass) {
        ctx.throw(401, errdef.ERR_MISSING_SESSION)
    } else {
        await next()
    }
})

// limit rate by user
app.use(ratelimit({
    db: redis,
    duration: 10 * 1000,
    max: 6,
    id: function (ctx) {
        return `userId:${ctx.userId}` || ctx.ip
    },
    blacklist: [],
    whitelist: []
}))

// routes
app.use(torrent.routes(), torrent.allowedMethods())
app.use(magnet.routes(), magnet.allowedMethods())
app.use(user.routes(), user.allowedMethods())
app.use(task.routes(), task.allowedMethods())
app.use(api.routes(), api.allowedMethods())
app.use(captcha.routes(), captcha.allowedMethods())

module.exports = app.listen(3001)
