'use strict'
const sequelize = require("./sequelize.js")
const Sequelize = require('sequelize')

const User = sequelize.define('users', {
    class: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: false,
      defaultValue: 0,
      comment: '用户等级'
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '用户登录密码'
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: '用户登录邮箱'
    },
    register_ip: {
      type: Sequelize.STRING,
      comment: '注册所用ip地址'
    },
    login_ip: {
      type: Sequelize.STRING,
      comment: '最后登录所用ip地址'
    },
    ip: {
      type: Sequelize.STRING
    }
  }
)

User.sync()

module.exports = User