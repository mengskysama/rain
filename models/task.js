'use strict'
var sequelize = require("./sequelize.js")
var Sequelize = require('sequelize')
var config = require('../config')
var File = require('./file')
var Cache = require('./cache')
var NodeApi = require('../api/node_api')
const TASK_PER_PAGE = 12

var Task = sequelize.define('tasks', {
    info_hash: {
      type: Sequelize.STRING,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    node_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    progress: {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    num_peers: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    num_seeds: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_size: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    total_done: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    download_payload_rate: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    eta: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    state: {
      type: Sequelize.STRING,
      allowNull: false
    },
    // todo migrate
    create_time: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }
)

Task.getTaskByUserId = async (userId, curPage) => {
  let filter = {
    where: {
      user_id: userId
    },
    order: [['id', 'desc']]
  }
  if (curPage) {
    filter.offset = (curPage - 1) * TASK_PER_PAGE
    filter.limit = TASK_PER_PAGE
  }
  return await Task.findAndCountAll(filter)
}

Task.getTask = async (where) => {
  return await Task.findAll({where})
}

Task.createTask = async (userId, node, torrentExtraData, torrent) => {
  let t = await sequelize.transaction()
  // insert task
  try {
    let progress = 0
    let state = 'Created'
    let nodeName = node.name
    let _task = await Task.findOne({where: {info_hash: torrentExtraData.infoHash}})
    if (_task) {
        // copy state
        progress = _task.progress
        state = _task.state
        nodeName = _task.node_name
    } else {
        // get from cache storage
        let cache = await Cache.findOne({where: {info_hash: torrentExtraData.infoHash}})
        if (cache) {
          progress = 99
          state = 'CacheQueued'
        } else {
          // call node api create task
          let res = await NodeApi.createTasks(node, torrent, torrentExtraData.infoHash)
          // console.log(res)
          if (res.errCode !== 0) {
              throw new Error('node create failed')
          }
        }
    }
    let taskInfo = {
      info_hash: torrentExtraData.infoHash,
      name: torrentExtraData.torrentName,
      user_id: userId,
      total_size: torrentExtraData.torrentLength,
      node_name: nodeName,
      state,
      progress
    }
    let task = await Task.create(taskInfo, {transaction: t})
    let file = await File.findOne({where: {torrent_info_hash: torrentExtraData.infoHash}})
    if (!file) {
      // files info not exists
      for (let idx in torrentExtraData.torrentFiles) {
          let file = torrentExtraData.torrentFiles[idx]
          let fileInfo = {
            path: file.path,
            name: file.name,
            size: file.length,
            torrent_info_hash: torrentExtraData.infoHash
          }
          await File.create(fileInfo, {transaction: t})
      }
    }
    await t.commit()
    return task
  } catch (e) {
    await t.rollback()
    throw e
  }
}

Task.getExpireTask = async () => {
  // if task(info_hash) add datetime > $torrent_expire_days
  //select Distinct(`info_hash`) , `name`, max(`create_time`) from tasks group by `info_hash`
  let tasks = await Task.findAll({
    where: {
      create_time: {
        $lt: ( d => new Date(d.setDate(d.getDate()-config.core.torrent_expire_days)) )(new Date)
      }
    },
    attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('info_hash')) ,'info_hash'],
    ],
    group: ['info_hash']
  })
  return tasks
}

Task.getUnstorageTask = async () => {
  let res = await sequelize.query('SELECT DISTINCT A.`info_hash`, A.`node_name`\
   FROM `tasks` A left join `caches` B \
   on A.`info_hash` = B.`info_hash` \
   WHERE A.progress=100 AND B.`info_hash` is null')
   if (res.length >= 1) return res[0] // ???
   return []
}

Task.sync()

module.exports = Task
