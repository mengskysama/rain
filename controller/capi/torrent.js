'use strict'
const router = require('koa-router')()
const errdef = require('./../../utils/errdef')
const config = require('./../../config')
const Redis = require("ioredis")
const redis = new Redis(config.redis)
const asyncBusboy = require('async-busboy')
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const deleteFile = util.promisify(fs.unlink)
const {getTorrentExtraInfo} = require('./../../utils/torrent')
const regMagnetHash = /([a-fA-F0-9]{40})/
const regBtcacheKey = /name="key" value="([\s\S]+?)"/

router.prefix('/capi/torrent')

router.post('/upload', uploadTorrent)


// fetch torrent from 3rd site
async function uploadTorrent(ctx, next) {
    let {files, fields} = await asyncBusboy(ctx.req, {limits: {
      fileSize: 1 * 1024 * 1024
    }})

    let torrentBin = await readFile(files[0].path)
    await deleteFile(files[0].path)
    if (torrentBin.length > config.core.torrent_bin_max_length) {
        ctx.throw(500, errdef.ERR_TORRENT_BIN_TOO_LARGE)
    }
    
    // parser torrent
    let torrentExtraData = null
    try {
        torrentExtraData = getTorrentExtraInfo(torrentBin)
    } catch (e) {
        // console.log(e)
        ctx.throw(500, errdef.ERR_TORRENT_BIN_INVAILD)
    }
    if (torrentExtraData.torrentFiles.length > config.core.torrent_files_max_count) {
        ctx.throw(500, errdef.ERR_TORRENT_FILES_TOO_MUCH)
    } else if (torrentExtraData.torrentLength > config.core.torrent_files_max_length) {
        ctx.throw(500, errdef.ERR_TORRENT_FILES_LENGTH_TOO_LARGE)
    }

    // put torrent to redis
    let torrentKey = `torrent:bin:${torrentExtraData.infoHash}`
    await redis.set(torrentKey, torrentBin, 'EX', 300)

    ctx.body = {
        data: torrentExtraData.infoHash,
        errorMsg: 'upload success',
        errCode: 0}
}

module.exports = router
