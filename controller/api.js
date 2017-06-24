'use strict'
var router = require('koa-router')()
var errdef = require('../utils/errdef')
var Task = require('../models/task')
var Node = require('../models/node')
var Cache = require('../models/cache')
var NodeApi = require('../api/node_api')


router.prefix('/api')

router.get('/tasks', tasks)
router.delete('/tasks/:infoHash/delete', tasksDelete)

router.get('/nodes/:nodeName/ping', nodePing)
router.get('/nodes/:nodeName/tasks', nodeTasks)


async function tasks(ctx, next) {
    let tasks = null
    if (ctx.query.expire === 'true') {
        tasks = await Task.getExpireTask()
    } else if (ctx.query.info_hash) {
        tasks = await Task.getTask({
            info_hash: ctx.query.info_hash
        })
    } else if (ctx.query.unstorage === 'true') {
        tasks = await Task.getUnstorageTask()
    } else if (ctx.query.oldest === 'true') {
        tasks = await Task.findAll({
            where: {
                node_name: ctx.query.node_name
            },
            order: [['create_time', 'ASC']],
            limit: 1
        })
    } else {
        ctx.throw(400, errdef.ERR_MISSING_ARGUMENT)
    }
    ctx.body = {
        data: tasks
    }
}

async function tasksDelete(ctx, next) {
    let tasks = await Task.getTask({
        info_hash: ctx.params.infoHash
    })
    if (tasks.length === 0) {
        ctx.throw(500, errdef.ERR_TASK_NOT_FOUND)
    }
    let node = await Node.getNode(tasks[0].node_name)
    let res = await NodeApi.deleteTasks(node, tasks[0].info_hash)
    // note: if node call rpc success or task not exists errCode 0
    if (res.errCode !== 0) {
        ctx.throw(500, errdef.ERR_NODE_RESPONSE_ERROR)
    }
    // delete
    for (let idx in tasks) {
        tasks[idx].destroy()
    }
    ctx.body = {
        'errCode': 0,
        'data': ''
    }
}

async function nodePing(ctx, next) {
    let node = Node.getNode(ctx.params.nodeName)

    let res = await NodeApi.ping(node)
    if (res.errCode !== 0) {
        ctx.throw(500, errdef.ERR_NODE_RESPONSE_ERROR)
    }
    ctx.body = {
        'errCode': 0,
        'data': res.data
    }
}

async function nodeTasks(ctx, next) {
    let node = Node.getNode(ctx.params.nodeName)
    let res = await NodeApi.getTasks(node)
    if (res.errCode !== 0) {
        ctx.throw(500, errdef.ERR_NODE_RESPONSE_ERROR)
    }
    ctx.body = {
        'errCode': 0,
        'data': res.data
    }
}

module.exports = router
