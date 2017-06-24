'use strict'
const router = require('koa-router')()
const errdef = require('./../../utils/errdef')
const Task = require('./../../models/task')
const File = require('./../../models/file')
const Node = require('./../../models/node')
const {getSignatureUrl} = require('./../../utils/signature')
const Redis = require('ioredis')
const config = require('./../../config')
const redis = new Redis(config.redis)
const {getTorrentExtraInfo} = require('./../../utils/torrent')

const regInfoHash = /^[a-fA-F0-9]{40}$/


router.prefix('/capi/tasks')

router.post('/add', addTask)
router.get('/', listTask)
router.get('/:infoHash/files', taskFiles)


async function addTask(ctx, next) {
    const data = ctx.request.body

    // infoHash
    if (!regInfoHash.exec(data.infoHash)) {
        ctx.throw(400, errdef.ERR_INVAILD_INFOHASH)
    }

    // get 
    let tasks = await Task.findAll({
      where: {
        user_id: ctx.userId,
        progress: {
            $lt: 99.5
        },
        state: ['CacheQueued', 'Downloading', 'Created']
      }
    })
    if (tasks.length >= config.core.torrent_cucurrent_max) {
        ctx.throw(400, errdef.ERR_TOO_MANY_TASH)
    }

    // check task if added by user
    let task = await Task.findOne({
      where: {
        user_id: ctx.userId,
        info_hash: data.infoHash
      }
    })
    if (task) {
        ctx.throw(400, errdef.ERR_TASK_EXISTS)
    }

    // get torrent from redis
    let torrentKey = `torrent:bin:${data.infoHash.toLowerCase()}`
    let torrent = await redis.getBuffer(torrentKey)
    if (!torrent) {
        ctx.throw(500, errdef.ERR_TORRENT_BIN_NOT_FOUND)
    } else if (torrent.length > config.core.torrent_bin_max_length) {
        ctx.throw(500, errdef.ERR_TORRENT_BIN_TOO_LARGE)
    }

    // parser torrent and create task
    let torrentExtraData = null
    try {
        torrentExtraData = getTorrentExtraInfo(torrent)
    } catch (e) {
        // console.log(e)
        ctx.throw(500, errdef.ERR_TORRENT_BIN_INVAILD)
    }
    if (torrentExtraData.torrentFiles.length > config.core.torrent_files_max_count) {
        ctx.throw(500, errdef.ERR_TORRENT_FILES_TOO_MUCH)
    } else if (torrentExtraData.torrentLength > config.core.torrent_files_max_length) {
        ctx.throw(500, errdef.ERR_TORRENT_FILES_LENGTH_TOO_LARGE)
    }

    // todo: chooise node
    let node = Node.getNode(config.core.download_node)
    task = await Task.createTask(ctx.userId, node, torrentExtraData, torrent)

    ctx.body = {
        errCode: 0,
        errMsg: 'add task success',
        data: task.id
    }
}

async function listTask(ctx, next) {
    const curPage = ctx.query.cur_page ? Number(ctx.query.cur_page) : 1
    let tasks = await Task.getTaskByUserId(ctx.userId, curPage)
    ctx.body = {
        errCode: 0,
        errMsg: 'success',
        'total': tasks.count,
        'data': tasks.rows
    }
}

async function taskFiles(ctx, next) {
    let task = await Task.findOne({
      where: {
        user_id: ctx.userId,
        info_hash: ctx.params.infoHash
      }
    })
    if (!task) {
        ctx.throw(400, errdef.ERR_TASK_NOT_FOUND)
    }

    let files = await File.getFiles({
        torrent_info_hash: ctx.params.infoHash
    })
    if (!files) {
        ctx.throw(404, errdef.ERR_FILE_NOT_FOUND)
    }

    let linkFiles = []
    let node = Node.getNode(task.node_name)
    files.forEach((file, idx) => {
        linkFiles.push({
            links: getSignatureUrl(ctx.userId, task.id, node, file),
            name: `${file.path}${file.name}`,
            size: file.size
        })
    })
    ctx.body = {
        'errCode': 0,
        'data': linkFiles,
        'errMsg': 'success'
    }
}

module.exports = router
