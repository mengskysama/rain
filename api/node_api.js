var requests = require('../utils/requests')
var Node = require('../models/node')
var {Base64} = require('js-base64')
var qs = require('qs')


var request = async (node, method, url, timeout, data) => {
    let config = {
        method: method,
        url: url,
        baseURL: node.baseURL,
        timeout: timeout || 10000,
        params: {
            token: node.token
        }
    }
    if (method == 'post') {
        config.data = qs.stringify(data)
    }
    let res = await requests.request(config)
    if (!res || typeof res.data.errCode === 'undefined') {
        return {
            errCode: -1,
            errMsg: 'internal error please contact admin'
        }
    }
    return res.data
}

exports.ping = async (node) => {
    return await request(node, 'get', `/api/ping`)
}

exports.getTasks = async (node) => {
    return await request(node, 'get', `/api/node/tasks`)
}

exports.createTasks = async (node, torrentBin, infoHash) => {
    let data = {
        torrent_data: torrentBin.toString('base64'),
        info_hash: infoHash
    }
    return await request(node, 'post', `/api/node/task/create`, 30000, data)
}

exports.deleteTasks = async (node, infoHash) => {
    return await request(node, 'delete', `/api/node/task/delete/${infoHash}`)
}
