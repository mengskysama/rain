'use strict'
const sequelize = require("./sequelize.js")
const Sequelize = require('sequelize')

const Cache = sequelize.define('caches', {
    info_hash: {
      type: Sequelize.STRING,
      allowNull: false
    },
    hit: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    create_time: {
      type: Sequelize.DATE,
      allowNull: false
    },
    last_hit_time: {
      type: Sequelize.DATE,
      allowNull: false
    },
    info_hash: {
      type: Sequelize.STRING,
      allowNull: false
    },
    key: {
      type: Sequelize.STRING
    },
    name: {
      type: Sequelize.STRING
    }
  }
)

Cache.getCacheByInfoHash = async (infoHash) => {
  return await Cache.findOne({where: {info_hash: infoHash}})
}

Cache.sync()

module.exports = Cache
