var requests = require('../utils/requests')
var Node = require('../models/node')
var Task = require('../models/task')
const config = require('../config')
const _ = require('lodash')
const common = require('../utils/common')

const API_GW = 'http://127.0.0.1:3001'

async function taskSync(node) {
    let res = await requests.request({
        method: 'get',
        url: `${API_GW}/api/nodes/${node.name}/tasks`,
        params: {
            token: config.core.api_token
        }
    })
    let updated_cnt = 0
    for (let infoHash in res.data.data) {
        let task = res.data.data[infoHash]
        let ret = await Task.update({
            num_peers: task.num_peers,
            progress: task.progress,
            download_payload_rate: task.download_payload_rate,
            eta: task.eta,
            state: task.state,
            total_size: task.total_size,
            total_done: task.total_done
        },{
            where:{
                info_hash: infoHash,
                state: ['Created', 'Queued', 'Downloading', 'Seeding', 'Paused', 'Error']
            }
        })
        updated_cnt += ret[0]
    }
    return updated_cnt
}

async function loooooop () {
    while (1) {
        for (let idx in config.node) {
            try {
                let node = config.node[idx]
                let cnt = await taskSync(node)
                console.log(`sync: ${cnt} task info from node ${node.name} to db`)
            } catch (e) {
                console.log(e)
            } finally {
                await common.sleep(5000)
            }
        }
    }
}

loooooop()
