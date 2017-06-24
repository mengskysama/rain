'use strict'
var bencode = require('bencode')
var decode = require('codepage').utils.decode
var sha1 = require('sha1')

exports.getTorrentExtraInfo = (torrentBin) => {
    const torrent = bencode.decode(torrentBin)
    let codepage = 65001 // magic utf8
    if (torrent.encoding) {
        // rutorrent
        switch (decode(codepage, torrent.encoding).toLowerCase().replace('-', '')) {
            case ('big5'):
                codepage = 950
                break
            case ('gbk'):
                codepage = 936
                break
            case ('shiftjis'):
                codepage = 932
                break
            case ('utf16'):
                encoding = 1201 // magic
                break
        }
    } else if (torrent.codepage) {
        codepage = torrent.codepage
    }

    let torrentLength = 0
    let torrentFiles = []
    let torrentName = decode(codepage, torrent.info.name)
    if (!torrent.info.files) {
        // single file
        torrentLength = torrent.info.length
        torrentFiles.push({
            path: '',
            name: torrentName,
            length: torrentLength
        })
    } else {
        torrent.info.files.forEach((file, idx) => {
            let path = decode(codepage, file.path[0])
            if (path.startsWith('_____padding_file_')) {
                // fucking BitComet padding file
            } else {
                let filePath = torrentName + '/'
                let fileName = ''
                if (file.path.length > 1) {
                    file.path.forEach((subPath, idx) => {
                        if (file.path.length == idx + 1) {
                            fileName = decode(codepage, subPath)
                        } else {
                            filePath += decode(codepage, subPath) + '/'
                        }
                    })
                } else {
                    fileName = decode(codepage, file.path[0])
                }
                torrentFiles.push({
                    path: filePath,
                    name: fileName,
                    length: file.length
                })
                torrentLength += file.length
            }
        })
    }

    // calc infoHash
    let infoHash = sha1(bencode.encode(torrent.info))

    return {
        torrentLength, torrentFiles, torrentName, infoHash
    }
}
