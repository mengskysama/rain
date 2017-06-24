var requests = require('../utils/requests')
const config = require('../config')
const common = require('../utils/common')
const _ = require('lodash')

const API_GW = 'http://127.0.0.1:3001'

async function taskPurge() {
    let res = await requests.request({
        method: 'get',
        url: `${API_GW}/api/tasks`,
        params: {
            expire: 'true',
            token: config.core.api_token
        }
    })
    let updated_cnt = 0

    for (let idx in res.data.data) {
        let m = res.data.data[idx]
        console.log(`will delete ${m.info_hash}`)
        await common.sleep(10 * 1000)
        let ret = await requests.request({
            method: 'delete',
            url: `${API_GW}/api/tasks/${m.info_hash}/delete`,
            params: {
                token: config.core.api_token
            }
        })
        let msg = 'success'
        if (!ret) {
            msg = 'failed'
        } else {
            updated_cnt += 1
        }
        console.log(`delete ${m.info_hash} ${msg} ... sleep 60s`)
        await common.sleep(60 * 1000)
    }
    return updated_cnt
}

async function taskPrugeForce(node) {
    // check free disk space by ping
    let res = await requests.request({
        method: 'get',
        url: `${API_GW}/api/nodes/${node.name}/ping`,
        params: {
            token: config.core.api_token
        }
    })
    if (res.data.data.available > config.core.force_purge_space) return 0
    // get oldest task
    res = await requests.request({
        method: 'get',
        url: `${API_GW}/api/tasks`,
        params: {
            oldest: 'true',
            node_name: node.name,
            token: config.core.api_token
        }
    })
    // do delete
    if (res.data.data.length == 0) throw new Error('no task found.')
    let infoHash = res.data.data[0].info_hash
    console.log(`will delete ${infoHash}`)
    await common.sleep(10 * 1000)
    let ret = await requests.request({
        method: 'delete',
        url: `${API_GW}/api/tasks/${infoHash}/delete`,
        params: {
            token: config.core.api_token
        }
    })
    if (!ret) return 0
    return 1
}

async function loooooop () {
    while (1) {
        try {
            let cnt = await taskPurge()
            // free space on each node
            if (config.core.force_purge) {
                for (let idx in config.node) {
                    let node = config.node[idx]
                    try {
                        success = await taskPrugeForce(node)
                        if (success) {
                            cnt += 1
                            break
                        }
                    } catch (e) {
                        console.log(e)
                    }
                }
            }
            console.log(`purge: ${cnt} task purge from rain`)
        } catch (e) {
            console.log(e)
        } finally {
            await common.sleep(30000)
        }
    }
}

loooooop()
