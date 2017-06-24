'use strict'
const sequelize = require("./sequelize.js")
const Sequelize = require('sequelize')

const File = sequelize.define('files', {
    path: {
      type: Sequelize.STRING,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    size: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    torrent_info_hash: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }
)

File.getFiles = async (where) => {
  return await File.findAll({where})
}

File.sync()

module.exports = File