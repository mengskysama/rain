'use strict'
var bencode = require('bencode')
var decode = require('codepage').utils.decode
var sha1 = require('sha1')
var {Base64} = require('js-base64')
var config = require('../config')
var md5 = require('md5')


exports.getSignatureUrl = (userId, taskId, node, file) => {
    let filePath = `${file.torrent_info_hash}/${file.path}${file.name}`
    let filePathB64 = Base64.encode(filePath).replace('/', '-')
    let timeStamp = Date.parse(new Date()) / 1000
    let signStr = `${filePathB64}${taskId}${userId}${timeStamp}${config.core.file_signature_key}`
    let signature = md5(signStr)
    let fileName = encodeURI(file.name)
    let links = []
    node.cdn.forEach((cdn, idx) => {
        let url = `${cdn.url}/files/${filePathB64}/${taskId}/${userId}/${timeStamp}/${signature}/${fileName}`
        links.push({url: url, location: cdn.location})
    })
    return links
}
