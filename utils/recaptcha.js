'use strict'
const errdef = require('./errdef')
const axios = require('axios')
const config = require('../config')


exports.checkCaptch = async (inputCaptcha) => {
    const res = await axios({
        method: 'post',
        baseURL: 'https://www.google.com',
        url: '/recaptcha/api/siteverify',
        params: {
            secret: config.recaptcha.secret,
            response: inputCaptcha
        }
    })

    if (res.data.success === true) {
        return true
    }
}
