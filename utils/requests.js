var axios = require('axios')
var logger = require('log4js').getLogger('requests')


exports.request = async (config) => {
    let res
    try {
        if (!config.timeout) {
            config.timeout = 60000
        }
        return await axios(config)
    } catch (err) {
        if (err.response) {
            logger.error('fail to request:',
                `${err.response.request.res.responseUrl}${err.response.request.path}`,
                'code:', err.response.status,
                '\ndata:\n', err.response.data
            )
        } else {
            logger.error('fail to request:', 
                `${err.request._options.protocol}//${err.request._options.hostname}${err.request._options.path}`
            )
        }
        return null
    }
}
