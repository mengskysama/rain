'use strict'
const router = require('koa-router')()
const errdef = require('./../../utils/errdef')
const recaptcha = require('./../../utils/recaptcha')
const User = require('./../../models/user.js')
const regEmail = /(gmail.com|hotmail.com|qq.com)$/
const regEmail2 = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
const regPassword = /[\S]{6,16}$/
// const {smtpClient} = require('./../../utils/smtp')


router.prefix('/capi/user')

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)


async function register(ctx, next) {
    const data = ctx.request.body
    let vaildMail = false

    // email
    if (!regEmail.exec(data.email) || !regEmail2.exec(data.email)) {
        ctx.throw(400, errdef.ERR_INVAILD_EMAIL)
    }

    // password
    if (!regPassword.exec(data.password)) {
        ctx.throw(400, errdef.ERR_INVAILD_PASSWORD)
    }

    console.log(data.answered == ctx.session.captcha)
    console.log(data.answered, ctx.session.captcha)
    if (typeof ctx.session.captcha === 'undefined'||
    typeof ctx.session.captcha === 'undefined' ||
    data.answered !== ctx.session.captcha) {
        ctx.throw(400, errdef.ERR_INVAILD_ANSWERED)
    }

    // captcha
    // if(!recaptcha.checkCaptch(data.captcha)) {
    //     ctx.throw(400, errdef.ERR_INVAILD_CAPTCHA)
    // }

    /*
    let success = null
    smtpClient.send({
        text:    "tedt",
        from:    "@gmail.com",
        to:      "@qq.com",
        subject: "testing emailjs"
    }, function(err, message) {
        // todo I need a promisifyall
        if (err) {
            success = false
            console.log(err)
        } else {
            success = true
        }
    }.bind(this))
    // wait smtp response
    while (true) {
        if (success !== null) break
        await sleep(1000)
    }
    if (!success) {
      ctx.throw(500, errdef.ERR_SEND_MAIL)
    }
    */

    // insert
    const result = await User.findOrCreate({
      where: {
        email: data.email
      },
      defaults: {
            password: data.password,
            email: data.email,
            register_ip: ctx.request.ip,
            ip: ctx.request.ip
      }
    })
    const created = result[1]
    if (!created) {
        //exist
        ctx.throw(400, errdef.ERR_EMAIL_ALREAD_EXIST)
    }

    ctx.body = {
        errCode: 0,
        errMsg: 'register success'
    }
}

async function login(ctx, next) {
    let data = ctx.request.body
    let result = await User.findOne({
        where: {
            email: data.email,
            password: data.password
        }
    })
    if (!result) {
        ctx.throw(403, errdef.ERR_INVAILD_EMAIL_OR_PASSWORD)
    }

    // server side seesion
    ctx.session.userInfo = {
        id: result.id,
        nick_name: result.nick_name
    }

    ctx.body = {
        errCode: 0,
        errMsg: 'login success'
    }
}

async function logout(ctx, next) {
    let data = ctx.request.body

    // server side seesion
    ctx.session.userInfo = null

    ctx.body = {
        errCode: 0,
        errMsg: 'logout success'
    }
}

var sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, time)
  })
}

module.exports = router
