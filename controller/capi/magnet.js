'use strict'
const router = require('koa-router')()
const axios = require('axios')
const Redis = require("ioredis")
const uuidv4 = require('uuid/v4')
const errdef = require('./../../utils/errdef')
const {getTorrentExtraInfo} = require('./../../utils/torrent')
const config = require('./../../config')
const redis = new Redis(config.redis)
const qs = require('qs')

const regMagnetHash = /([a-fA-F0-9]{40})/
const regBtcacheKey = /name="key" value="([\s\S]+?)"/
const regTorrentOrgKey = /Hash Info/

router.prefix('/capi/magnet')

router.get('/torrent/prefetch', magnet2torrentPrefetch)
router.get('/torrent/prefetch/captcha', magnet2torrentPrefetchCaptcha)
router.get('/torrent/fetch', magnet2torrentFetch)


// fetch torrent from 3rd site
async function magnet2torrentPrefetch(ctx, next) {
    let uuid = uuidv4()
    let magnet = ctx.query.magnet
    let errMsg = ''
    let errCode = 0
    let info = null
    let match = regMagnetHash.exec(magnet)
    if (!match) {
        ctx.throw(400, errdef.ERR_MAGNET_FORMAT)
    }
    let infoHash = match[1]
    let session = axios.create({timeout: 5000})
    // get torrent page
    let res = await session.get(`http://btcache.me/torrent/${infoHash}`)
    match = regBtcacheKey.exec(res.data)
    if (match) {
        let key = match[1]
        // get captcha
        res = await axios.get(`http://btcache.me/captcha?t=${Math.ceil(Date.parse(new Date())/10000)}`, {responseType: 'arraybuffer', timeout: 2000})
        let cookie = res.headers['set-cookie'][0]
        // console.log("cookie:", cookie)
        uuid = uuidv4()
        info = {
            site: 1,
            key,
            cookie,
            captcha: new Buffer(res.data, 'binary').toString('base64')
        }
    }
    
    if (!info) {
        res = await session.get(`http://www.torrent.org.cn/home/convert/magnet2torrent.html?hash=${infoHash}`)
        match = regTorrentOrgKey.exec(res.data)
        if (match) {
            let key = infoHash.toUpperCase()
            let cookie = res.headers['set-cookie'][0]
            // get captcha
            res = await session.get('http://www.torrent.org.cn/home/torrent/yanzhengma', 
            {
                responseType: 'arraybuffer',
                headers: {
                    Cookie: cookie
                }
            })
            
            uuid = uuidv4()
            info = {
                site: 2,
                key,
                cookie,
                captcha: new Buffer(res.data, 'binary').toString('base64')
            }
        }
    }
    if (!info) {
        ctx.throw(404, errdef.ERR_MAGNET_NOT_FOUND)
    }
    await redis.set(`magnet:fetch:${uuid}`, JSON.stringify(info), 'EX', 300)
    ctx.body = { data: uuid, errMsg, errCode }
}

async function magnet2torrentPrefetchCaptcha(ctx, next) {
    let uuid = ctx.query.uuid
    let info = await redis.get(`magnet:fetch:${uuid}`)
    info = JSON.parse(info)
    let buf = new Buffer(info.captcha, 'base64')
    ctx.body = buf
    ctx.type = 'image/jpeg'
}

// fetch torrent from 3rd site
async function magnet2torrentFetch(ctx, next) {
    let captcha = ctx.query.captcha
    let uuid = ctx.query.uuid
    let data = null
    let torrentBin = null
    let torrentExtraData = null
    let info = await redis.get(`magnet:fetch:${uuid}`)
    let res = null
    info = JSON.parse(info)
    switch (info.site) {
        case 1:
            // get torrent
            res = await axios({
                method: 'post',
                baseURL: 'http://btcache.me/download',
                data: qs.stringify({
                    key: info.key,
                    captcha: captcha
                }),
                timeout: 10000,
                headers: {'Cookie': info.cookie},
                responseType: 'arraybuffer'
            })
            torrentBin = res.data
            break
        case 2:
            // get torrent
            res = await axios({
                method: 'get',
                baseURL: 'http://www.torrent.org.cn/Home/torrent/download.html',
                params: {
                    hash: info.key,
                    code: captcha
                },
                timeout: 10000,
                headers: {
                    Cookie: info.cookie
                },
                responseType: 'arraybuffer'
            })
            torrentBin = res.data
            break
        default:
            ctx.throw(400, 'site not vaild.')
    }

    // parser torrent
    try {
        torrentExtraData = getTorrentExtraInfo(res.data)
    } catch (e) {
        // console.log(e)
        ctx.throw(500, errdef.ERR_INVAILD_ANSWERED)
    }

    // store torrent to redis
    let torrentKey = `torrent:bin:${torrentExtraData.infoHash}`
    await redis.set(torrentKey, res.data, 'EX', 300)
    data = torrentExtraData.infoHash
    ctx.body = { data, errMsg: '', errCode: 0 }
}


module.exports = router
