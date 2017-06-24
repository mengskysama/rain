var config = require('../config')


exports.getNode = (nodeName) => {
    let node
    config.node.forEach( x => {
        if (x.name == nodeName) {
            node = x
            return false
        }
    })
    return node
}
